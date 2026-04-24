// src/utils/XmlValidator.ts
interface ValidatorResult {
  ok: boolean;
  doc?: Document | null;
}

let file: File | null = null;
let errorMessage = "";
let resultMessage = "";

const allowedKblRoots: string[] = [
  "KBL_container",
  "KBLContainer",
  "KBL_Container",
  "KBLContainer_Old",
].flatMap((str) => [str, str.toLowerCase()]);

const allowedVecRoots: string[] = [
  "VecContent",
  "VecContentV2",
  "VecContent_Base",
].flatMap((str) => [str, str.toLowerCase()]);

const ioddNamespace = "http://www.io-link.com/IODD/2010/10";

/* =========================
   XML base validation
========================= */

async function validateWellFormedXML(f: File): Promise<ValidatorResult> {
  errorMessage = "";
  resultMessage = "";

  try {
    const text = await f.text();

    if (!text.trim().startsWith("<?xml")) {
      errorMessage = "XML header is missing.";
      return { ok: false, doc: null };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");

    const parserError =
      doc.querySelector("parsererror") ||
      doc.querySelector('parsererror[name="parsererror"]');

    if (parserError) {
      errorMessage = "XML is not well-formed.";
      return { ok: false, doc: null };
    }

    return { ok: true, doc };
  } catch (e) {
    errorMessage = "Error while parsing the XML file.";
    return { ok: false, doc: null };
  }
}

/* =========================
   Generic XML helpers
========================= */

function hasElement(doc: Document, tagName: string): boolean {
  return doc.getElementsByTagNameNS("*", tagName).length > 0;
}

function getFirstElement(doc: Document, tagName: string): Element | null {
  return doc.getElementsByTagNameNS("*", tagName)[0] || null;
}

function hasDirectChildElement(parent: Element | null, tagName: string): boolean {
  if (!parent) return false;

  return Array.from(parent.children).some(
    (child) => child.localName === tagName
  );
}

/* =========================
   IODD detection
========================= */

function isIoddDoc(doc: Document): boolean {
  const root = doc.documentElement;
  if (!root) return false;

  const ns = root.namespaceURI || "";
  return ns === ioddNamespace;
}

/* =========================
   IODD detail checks
========================= */

function hasDeviceNameOrVariantProductName(doc: Document): boolean {
  const deviceIdentity = getFirstElement(doc, "DeviceIdentity");
  const deviceVariant = getFirstElement(doc, "DeviceVariant");

  const hasDeviceName = hasDirectChildElement(deviceIdentity, "DeviceName");
  const hasVariantProductName = hasDirectChildElement(deviceVariant, "ProductName");

  return hasDeviceName || hasVariantProductName;
}

function hasPrimaryLanguageInExternalTextCollection(doc: Document): boolean {
  const collections = doc.getElementsByTagNameNS("*", "ExternalTextCollection");

  if (collections.length === 0) return false;

  for (const collection of Array.from(collections)) {
    const hasPrimaryLanguage = Array.from(collection.children).some(
      (child) => child.localName === "PrimaryLanguage"
    );

    if (hasPrimaryLanguage) {
      return true;
    }
  }

  return false;
}

function validateIoddCore(doc: Document): boolean {
  if (!hasElement(doc, "DeviceIdentity")) {
    errorMessage = "IODD element 'DeviceIdentity' is missing.";
    resultMessage = "";
    return false;
  }

  if (!hasElement(doc, "DeviceFunction")) {
    errorMessage = "IODD element 'DeviceFunction' is missing.";
    resultMessage = "";
    return false;
  }

  if (!hasDeviceNameOrVariantProductName(doc)) {
    errorMessage =
      "IODD element 'DeviceIdentity/DeviceName' is missing, and fallback 'DeviceVariant/ProductName' is also missing.";
    resultMessage = "";
    return false;
  }

  const hasExternalTextCollection = hasElement(doc, "ExternalTextCollection");
  if (
    hasExternalTextCollection &&
    !hasPrimaryLanguageInExternalTextCollection(doc)
  ) {
    errorMessage =
      "IODD element 'ExternalTextCollection' exists, but 'PrimaryLanguage' is missing.";
    resultMessage = "";
    return false;
  }

  errorMessage = "";
  resultMessage = "Valid IODD file (basic structure detected).";
  return true;
}

/* =========================
   Format-specific validators
========================= */

async function validateVecFile(f: File): Promise<boolean> {
  if (!f.name.toLowerCase().endsWith(".vec")) {
    errorMessage = "Only .vec files are allowed.";
    resultMessage = "";
    return false;
  }

  const { ok, doc } = await validateWellFormedXML(f);
  if (!ok || !doc) return false;

  const root = doc.documentElement;
  if (!root) {
    errorMessage = "No root element found.";
    resultMessage = "";
    return false;
  }

  const localName = root.localName;
  if (!allowedVecRoots.includes(localName)) {
    errorMessage = `${localName} is not a valid root element for .vec files.`;
    resultMessage = "";
    return false;
  }

  errorMessage = "";
  resultMessage = `Valid VEC file (root: ${localName}).`;
  return true;
}

async function validateKBLFile(f: File): Promise<boolean> {
  if (!f.name.toLowerCase().endsWith(".kbl")) {
    errorMessage = "Only .kbl files are allowed.";
    resultMessage = "";
    return false;
  }

  const { ok, doc } = await validateWellFormedXML(f);
  if (!ok || !doc) return false;

  const root = doc.documentElement;
  if (!root) {
    errorMessage = "No root element found.";
    resultMessage = "";
    return false;
  }

  const localName = root.localName;
  if (!allowedKblRoots.includes(localName)) {
    errorMessage = `${localName} is not a valid root element for .kbl files.`;
    resultMessage = "";
    return false;
  }

  errorMessage = "";
  resultMessage = `Valid KBL file (root: ${localName}).`;
  return true;
}

async function validateXmlFile(f: File): Promise<boolean> {
  const { ok, doc } = await validateWellFormedXML(f);
  if (!ok || !doc) return false;

  if (isIoddDoc(doc)) {
    return validateIoddCore(doc);
  }

  errorMessage = "";
  resultMessage = "Valid XML file (well-formed, no IODD namespace detected).";
  return true;
}

/* =========================
   Public entry point
========================= */

export async function uploadHandler(fileInput: any | null): Promise<string> {
  if (!fileInput) {
    errorMessage = "No file selected.";
    resultMessage = "";
    return errorMessage;
  }

  const f = fileInput;
  file = f;

  let ok = false;
  const lowerName = f.name.toLowerCase();

  if (lowerName.endsWith(".vec")) {
    ok = await validateVecFile(f);
  } else if (lowerName.endsWith(".kbl")) {
    ok = await validateKBLFile(f);
  } else if (lowerName.endsWith(".xml")) {
    ok = await validateXmlFile(f);
  } else {
    errorMessage = "";
    resultMessage = "";
    ok = false;
  }

  return errorMessage;
}
<<<<<<< HEAD
=======

export interface XmlValidationResult {
  ok: boolean;
  document?: Document;
  error?: string;
}

const ALLOWED_KBL_ROOTS = new Set(['kbl_container', 'kblcontainer', 'kblcontainer_old']);
const ALLOWED_VEC_ROOTS = new Set(['veccontent', 'veccontentv2', 'veccontent_base']);

function getFileExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const index = normalized.lastIndexOf('.');
  if (index === -1) return '';
  return normalized.slice(index + 1);
}

export async function parseXmlFile(file: File): Promise<XmlValidationResult> {
  try {
    const text = await file.text();
    const parser = new DOMParser();
    const document = parser.parseFromString(text, 'text/xml');
    const parserError = document.querySelector('parsererror');

    if (parserError) {
      return { ok: false, error: 'XML is not well-formed.' };
    }

    if (!document.documentElement) {
      return { ok: false, error: 'No root element found.' };
    }

    return { ok: true, document };
  } catch {
    return { ok: false, error: 'Error while parsing the XML file.' };
  }
}
>>>>>>> 056973caf2cfbd0a55cd406915053e8fd5540029
