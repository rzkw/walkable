type Project = {
  name: string
  description: string
  link: string
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

type TechStack = {
  category: string
  skills: string
}

type SocialLink = {
  label: string
  link: string
}

export const PROJECTS: Project[] = [
  {
    name: 'Terraform docs with MCP-verified state',
    description: 'and project-scoped agent configs',
    link: 'https://medium.com/@walkable-llc/terraform-docs-with-mcp-verified-state-and-project-scoped-agent-configs-078a2a41c94f',
    id: 'project1',
  },
  {
    name: 'Using ip route to configure two nodes',
    description: 'static route setup between two home lab nodes',
    link: 'https://medium.com/@walkable-llc/using-ip-route-to-configure-two-nodes-f71a6ca5aabc',
    id: 'project2',
  },
]

export const CERTIFICATIONS: Certifications[] = [
  {
    company: 'Red Hat',
    title: 'Certified System Administrator (RHCSA)',
    start: '2025',
    end: '2028',
    link: 'https://rhtapps.redhat.com/verify?certId=250-168-689',
    id: 'cert1',
  },
  {
    company: 'Microsoft',
    title: 'Azure Fundamentals',
    start: '2025',
    end: 'Present',
    link: 'https://learn.microsoft.com/api/credentials/share/en-us/rzkw-8395/BFCE0D9347A25B10?sharingId=6C88A99A20F976E9',
    id: 'cert2',
  },
  {
    company: 'CompTIA',
    title: 'A+',
    start: '2025',
    end: '2028',
    link: 'https://www.credly.com/badges/d70f98c5-f558-466f-a2f9-b770485c14d0',
    id: 'cert3',
  },
]

export const BLOG_POSTS: BlogPost[] = [
  {
    title: 'My $0 Home Lab: Converting an old Windows 10 Laptop into a server',
    description:
      'Turning a resource-constrained machine into a headless Ubuntu node',
    link: '/projects/old-laptop-server',
    uid: 'blog-1',
  },
  {
    title: 'Exploring Virtualisation ',
    description: 'with VMWare Fusion',
    link: '/projects/exploring-virt',
    uid: 'blog-2',
  },
  {
    title: 'SMTP with Migadu',
    description:
      'Linking an email/SMTP provider to my custom domain, configuring DNS records',
    link: '/blog/setting-up-smtp',
    uid: 'blog-3',
  },
  {
    title: 'Setting up Cloudflare',
    description: 'Figuring out how to set up a domain through Cloudflare',
    link: '/blog/setting-up-cloudflare',
    uid: 'blog-4',
  },
  {
    title: 'Troubleshooting: adding a storage bucket to my blog',
    description: 'Configuring R2 storage on Cloudflare',
    link: '/blog/cache-r2bindings',
    uid: 'blog-5',
  },
  {
    title: 'SSH security hardening and other bits',
    description: 'ufw firewall, fail2ban and configs',
    link: '/blog/ssh-hardening',
    uid: 'blog-6',
  },
  {
    title: 'Integrating Grafana',
    description: 'for monitoring purposes',
    link: '/blog/grafana',
    uid: 'blog-7',
  },
  {
    title: 'Setting up Slack alerting from Grafana',
    description: 'to receive alerts from Linux node',
    link: '/blog/alerting',
    uid: 'blog-8',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Medium',
    link: 'https://medium.com/@walkable-llc',
  },
  {
    label: 'LinkedIn',
    link: 'https://www.linkedin.com/in/rizky-ramadhani3056/',
  },
  {
    label: 'GitHub',
    link: 'https://github.com/rzkw',
  },
  {
    label: 'Seek',
    link: 'http://seek.com.au/profile/rizky-ramadhani-l8CSc2jM2s',
  },
]

export const TECH_STACK: TechStack[] = [
  {
    category: 'Proficient in',
    skills:
      'Git • Docker • Linux • Bash • Ubuntu • GitHub • RHEL • Networking (TCP/IP, DNS) • VS Code • macOS',
  },
  {
    category: 'Experienced with',
    skills:
      'GitHub Actions • Oracle Cloud Infrastructure (OCI) • Cloudflare • YAML • MCP (Model Context Protocol) • OpenCode • Slack • Claude',
  },
  {
    category: 'Exposure to',
    skills:
      'Jira • Terraform • Grafana • AWS • Ansible • Azure • PowerShell • Python • JavaScript • Vercel • Kubernetes',
  },
]

export const EMAIL = 'hello@walk-llc.com'
