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

async function validateWellFormedXML(f: File): Promise<ValidatorResult> {
  errorMessage = "";
  resultMessage = "";

  try {
    const text = await f.text();

    if (!text.trim().startsWith('<?xml')) {
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
    const { ok: okXml } = await validateWellFormedXML(f);
    ok = okXml;
    if (okXml) {
      errorMessage = "";
      resultMessage = "Valid XML file (well-formed, without KBL/VEC-specific validation).";
    }
  } else {
    errorMessage = "";
    resultMessage = "";
    ok = false;
  }

  return errorMessage;
}

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
