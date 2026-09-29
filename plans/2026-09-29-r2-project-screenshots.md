# R2 screenshots for selected projects

## Goal

Show manually uploaded R2 screenshots for AWS Labs and OCI CloudInfra on the home page. Keep the Terraform Docs and Using `ip route` project images sourced from their Medium articles.

## Approach

- Add an optional screenshot object key to project data for AWS Labs and OCI CloudInfra only.
- Reuse the existing project image component. When an object key is set, render the same-origin image route; otherwise keep the existing Medium Open Graph lookup.
- Add a read-only route that validates a simple image filename, reads only from the `projects/` prefix of `IMAGES_R2_BUCKET`, returns the stored content type, and uses a short cache lifetime so replacing an object becomes visible quickly.
- Upload or replace screenshots with Wrangler under stable keys such as `projects/aws-labs.webp` and `projects/oci-cloudinfra.webp`. Change the project data key if a project later needs a different screenshot.
- Leave the existing production and preview bucket names as configured. Verify the production bucket and uploaded objects in Cloudflare when credentials are available; repository config alone does not prove the remote resources exist.

## Validation

- Run `npm run lint`.
- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Test a missing screenshot response locally where the R2 binding is available; confirm the two Medium projects still request `/api/og`.

## References

- Cloudflare R2 Workers API: bucket bindings, `get`, object bodies, metadata, and strong consistency: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- Wrangler R2 object upload command and content-type/cache-control options: https://developers.cloudflare.com/workers/wrangler/commands/r2/
- Next.js Route Handlers and dynamic route parameters: https://nextjs.org/docs/app/api-reference/file-conventions/route
- OpenNext Cloudflare adapter and runtime context: https://github.com/opennextjs/opennextjs-cloudflare
