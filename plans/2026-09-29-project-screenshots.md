# Static screenshots for selected projects

## Goal

Show manually maintained repository images for AWS Labs and OCI CloudInfra on the home page. Keep the existing `/api/og` behavior for Terraform Docs and Using `ip route` unchanged.

## Approach

- Set optional project image paths for AWS Labs and OCI CloudInfra to `/projects/aws-labs.png` and `/projects/oci-cloudinfra.png`. The image files can be added or replaced under `public/projects/` when available.
- Leave the existing `ProjectImage` component and `/api/og` lookup unchanged. Render the two explicit local image paths separately in the project list; the two Medium-linked projects continue using the existing component.
- Remove the `IMAGES_R2_BUCKET` binding from `wrangler.jsonc` and delete the R2 image route, as project screenshots will use Next.js public assets instead.
- Remove the previous Project screenshots section from the root README without adding replacement instructions.
- Remove the `IMAGES_R2_BUCKET` binding in the Cloudflare GUI separately; this repository change does not remove remote dashboard configuration.

## Validation

- Run `npm run lint` where supported.
- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Confirm the home page points the first two project blocks at their local PNG paths and the bottom two still use the untouched Medium image component.

## References

- Next.js `public` folder: files are served from root-relative URLs; public assets default to `Cache-Control: public, max-age=0`, which permits replacing an image without a versioned filename: https://nextjs.org/docs/app/api-reference/file-conventions/public-folder
- Cloudflare Wrangler configuration: R2 bindings are configured through `r2_buckets`; the now-unused binding can be removed from the repository config: https://developers.cloudflare.com/workers/wrangler/configuration/#r2-buckets
