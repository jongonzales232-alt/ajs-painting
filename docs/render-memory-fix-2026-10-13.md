# Render memory repair — October 13, 2026

The 512 MiB instance restarted after running out of memory during a request burst. The deployed version enabled on-demand optimization of gallery originals, including five photos about 6000px wide. This change moves those transforms out of visitor requests and removes persistent launcher processes.

## Validation

- Production build, its lint/type checks, targeted ESLint and shell syntax checks passed.
- 95 isolated regression checks passed: 10 public-image storage/streaming/privacy checks plus 85 existing image, quote, contact, scheduling, navigation and analytics checks.
- A running production build served seven public routes successfully; no page used `/_next/image`. Direct access to the disabled optimizer returned 404. Private-photo routes retained their protection.
- Three simultaneous admin uploads on a synthetic local database produced all 12 variants; deletion removed originals and variants. No emails, live records or production uploads were used.
- Desktop and 390px mobile gallery views retained `object-fit: contain`, 4:3 frames and no horizontal overflow. All 20 gallery images and both logos loaded after scrolling. The generated logo was 53,388 bytes, down from the 1,387,619-byte original.

## Controlled memory comparison

Windows, Node 24.19.0, Next 15.5.19; separate production builds of the deployed commit and this fix. Synthetic gallery: 15 smaller images plus five 6000×4000 JPEGs. Both versions received 40 image requests at widths 384 and 1920, concurrency eight, then the same 40 again. All 160 requests succeeded.

| App process RSS | Deployed code | Fixed code |
| --- | ---: | ---: |
| Before image burst | 131.8 MiB | 128.7 MiB |
| Peak | 325.3 MiB | 149.5 MiB |
| After traffic settled | 177.4 MiB | 145.1 MiB |

Peak app-process RSS fell approximately 54%. First-burst completion was 1.93 seconds versus 0.11 seconds locally. The fixed images used quality 82 rather than Next's default 75, so the transfer sizes differ (3.98 MB versus 2.83 MB for the 40 requests). Both used the same image dimensions. The sequential preparation process peaked at 88.8 MiB in the synthetic backfill.

These measurements are local Windows process RSS, not a Linux container limit test. They exclude launcher overhead and do not guarantee identical Render values. Runtime confirmation after deployment is still required. A persistent memory leak or the exact request that caused the earlier crash was not established.

## Rollout

Deploy the code and set Render's start command to `bash scripts/render-start.sh`. Existing database schema, originals, captions, privacy blurs, ordering and paid plan stay intact. Public variants are additive files on the existing persistent disk. Validate generation logs, gallery rendering, process count and memory after deployment.
