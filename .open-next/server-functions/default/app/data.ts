type Project = {
  name: string
  description: string
  link: string
  video: string
  id: string
}

type Certifications = {
  company: string
  title: string
  start: string
  end: string
  link: string
  id: string
}

type BlogPost = {
  title: string
  description: string
  link: string
  uid: string
}

type SocialLink = {
  label: string
  link: string
}

export const PROJECTS: Project[] = [
  {
    name: 'Converting resource-constrained hardware into a web/dev server',
    description:
      'turning an old laptop into an Ubuntu/Nginx server',
    link: '/projects/old-laptop-server',
    video:
      'https://res.cloudinary.com/read-cv/video/upload/t_v_b/v1/1/profileItems/W2azTw5BVbMXfj7F53G92hMVIn32/newProfileItem/d898be8a-7037-4c71-af0c-8997239b050d.mp4?_a=DATAdtAAZAA0',
    id: 'project1',
  },
  {
    name: 'Exploring Virtualisation',
    description: 'Using VMWare Fusion',
    link: '/projects/exploring-virt',
    video:
      'https://res.cloudinary.com/read-cv/video/upload/t_v_b/v1/1/profileItems/W2azTw5BVbMXfj7F53G92hMVIn32/XSfIvT7BUWbPRXhrbLed/ee6871c9-8400-49d2-8be9-e32675eabf7e.mp4?_a=DATAdtAAZAA0',
    id: 'project2',
  },
]

export const CERTIFICATIONS: Certifications[] = [
  {
    company: 'Microsoft',
    title: 'Azure Fundamentals',
    start: '2025',
    end: 'Present',
    link: 'https://learn.microsoft.com/api/credentials/share/en-us/rzkw-8395/BFCE0D9347A25B10?sharingId=6C88A99A20F976E9',
    id: 'cert1',
  },
  {
    company: 'CompTIA',
    title: 'A+',
    start: '2025',
    end: '2028',
    link: 'https://www.credly.com/badges/d70f98c5-f558-466f-a2f9-b770485c14d0',
    id: 'cert2',
  },

]

export const BLOG_POSTS: BlogPost[] = [
  // {
  //   title: 'How I turned an old laptop into a web/dev server',
  //   description: 'Expanding my basic server admin knowledge',
  //   link: '/blog/exploring-the-intersection-of-design-ai-and-design-engineering',
  //   uid: 'blog-1',
  // },
  {
    title: 'Setting up SMTP with Migadu',
    description:
      'Linking an email/SMTP provider to my custom domain, configuring DNS records',
    link: '/blog/setting-up-smtp',
    uid: 'blog-2',
  },
  {
    title: 'Setting up Cloudflare',
    description:
      'Figuring out how to set up a domain through Cloudflare',
    link: '/blog/setting-up-cloudflare',
    uid: 'blog-3',
  },
    {
    title: 'Setting up deploy previews on Netlify',
    description:
      'for working non-production branches',
    link: '/blog/deploy-preview',
    uid: 'blog-4',
  },

]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'GitHub',
    link: 'https://github.com/rzkw',
  },
  {
    label: 'Seek',
    link: 'http://seek.com.au/profile/rizky-ramadhani-l8CSc2jM2s',
  },
  {
    label: 'LinkedIn',
    link: 'https://www.linkedin.com/in/rizky-ramadhani3056/',
  },
]

export const EMAIL = 'hello@walk-llc.com'
