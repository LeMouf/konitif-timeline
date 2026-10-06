# Prepared module distribution

The `prepared` directory contains the built Timeline module, its complete SHA-256 inventory and the `konitif-candidate.json` descriptor consumed by the KONITIF catalog.

Select this repository, an exact commit or a branch resolved to an exact commit, and candidate folder `prepared`. Acquisition verifies bytes and admission remains separate from selection and execution. No build or dependency installation occurs during import. The declared tools dependency is not embedded; module runtime hosting remains a separate integration step. Existing package exports and the headless engine are unchanged.

Maintainers build using the already installed compiler, then run `node scripts/prepare-timeline-module-distribution.mjs . <new-directory>`. The generator rejects an existing destination and a package/lock version mismatch. Review and replace the previous prepared distribution explicitly, then verify the declared hashes before committing. Generated files under `prepared/dist` are intentionally tracked; the ordinary root `dist` remains ignored.