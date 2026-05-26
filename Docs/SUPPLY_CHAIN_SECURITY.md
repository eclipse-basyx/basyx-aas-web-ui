# Supply Chain Security

This repository's release pipeline for `eclipsebasyx/aas-gui` follows open supply-chain standards and produces verifiable artifacts.

For vulnerability reporting and disclosure policy, use the Eclipse BaSyx global security policy: https://github.com/eclipse-basyx/.github/blob/main/SECURITY.md.

## What the Release Workflow Produces

For each published release:

- Multi-architecture Docker image for:
  - `linux/amd64`
  - `linux/arm64`
  - `linux/arm/v7`
- Docker BuildKit OCI attestations attached to the image index:
  - provenance (`provenance: mode=max`)
  - SBOM (`sbom: true`)
- Sigstore Cosign keyless signature on the immutable digest (`image@sha256:...`)
- Exported SBOM files generated with Syft:
  - SPDX JSON: `aas-gui-<version>.spdx.json`
  - CycloneDX JSON: `aas-gui-<version>.cdx.json`
- SBOM uploads in two places:
  - GitHub Actions artifact (build-time evidence)
  - GitHub Release assets (versioned downloadable evidence)
- Optional report-only Trivy vulnerability scan with SARIF upload

## Trust Model

Images are signed by GitHub Actions OIDC identity for this repository.

Expected certificate identity for releases:

- `https://github.com/eclipse-basyx/basyx-aas-web-ui/.github/workflows/docker-release-ui.yml@refs/tags/<tag>`

Expected OIDC issuer:

- `https://token.actions.githubusercontent.com`

## Verify Image Signature (Digest First)

Install cosign and verify by immutable digest (not by mutable tag):

```bash
IMAGE="eclipsebasyx/aas-gui@sha256:<digest>"
IDENTITY="https://github.com/eclipse-basyx/basyx-aas-web-ui/.github/workflows/docker-release-ui.yml@refs/tags/<tag>"

cosign verify \
  --certificate-identity "$IDENTITY" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  "$IMAGE"
```

## Verify BuildKit OCI Attestations Exist

The workflow attaches provenance and SBOM as BuildKit OCI attestations.

```bash
IMAGE="eclipsebasyx/aas-gui@sha256:<digest>"

docker buildx imagetools inspect "$IMAGE" --raw | jq \
  '.manifests[] | select(.annotations["vnd.docker.reference.type"] == "attestation-manifest")'
```

If this returns attestation manifests, the OCI index has attached BuildKit attestations.

## Inspect BuildKit Provenance and SBOM Payloads

```bash
IMAGE="eclipsebasyx/aas-gui@sha256:<digest>"

# Provenance (SLSA predicate from BuildKit)
docker buildx imagetools inspect "$IMAGE" --format '{{ json (index .Provenance "linux/amd64").SLSA }}' | jq .

# SPDX SBOM predicate from BuildKit attestation
docker buildx imagetools inspect "$IMAGE" --format '{{ json (index .SBOM "linux/amd64").SPDX }}' | jq .
```

Fallback (if per-platform maps are not exposed by your Docker/Buildx version):

```bash
docker buildx imagetools inspect "$IMAGE" --format '{{ json .Provenance.SLSA }}' | jq .
docker buildx imagetools inspect "$IMAGE" --format '{{ json .SBOM.SPDX }}' | jq .
```

## Download SBOM Release Assets

Each release includes:

- `aas-gui-<version>.spdx.json`
- `aas-gui-<version>.cdx.json`
- `release-image-metadata.json`

These can be downloaded from the GitHub Release page for that tag.

## Artifact Types and What They Mean

- Signed image digest:
  - Cryptographic signature proving who signed the immutable image digest.
- BuildKit OCI attestations:
  - OCI-attached provenance/SBOM data produced at image build time.
- GitHub Actions SBOM artifact:
  - CI-run artifact retained for workflow evidence and troubleshooting.
- GitHub Release SBOM assets:
  - Versioned SBOM exports intended for downstream consumers and compliance records.

## Important Note About Attestation Verification

This workflow verifies:

- Cosign image signatures
- Presence and readability of BuildKit OCI provenance/SBOM attestations

It does not currently generate explicit Cosign attestations (`cosign attest`) for provenance or SBOM. Therefore, `cosign verify-attestation` is not the primary verification path for this repository at this time.

## Future Hardening Candidates

1. Add policy gates to block releases on unsigned or unverifiable digests.
2. Add configurable fail thresholds for vulnerability scan severity.
3. Add reproducibility checks for repeated builds of the same source revision.
4. Add downstream policy examples (for example admission control) for digest and signature enforcement.
