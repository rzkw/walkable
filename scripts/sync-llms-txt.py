#!/usr/bin/env python3
"""Sync Medium RSS feed entries into public/llms.txt.

Fetches the 10 most recent Medium posts, categorizes them,
generates content summaries, and merges with hardcoded on-site content.
"""

import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import urlopen, Request

MEDIUM_FEED = "https://medium.com/@walkable-llc/feed"
OUTPUT = Path(__file__).resolve().parent.parent / "public" / "llms.txt"
MAX_POSTS = 10

CATEGORY_MAP = {
    "oci-terraform": [
        "oracle-cloud",
        "terraform",
        "object-storage",
        "finops",
        "terraform-remote-state",
        "cloud-computing",
        "agentic-workflow",
        "agentic-ai",
        "open-code",
    ],
    "security-github": [
        "security",
        "github-actions",
        "ai-agent",
        "mcp-server",
        "github",
    ],
    "linux-networking": [
        "linux",
        "sysadmin",
        "systems-engineering",
        "ubuntu",
        "docker",
        "mac",
        "branching-strategy",
    ],
}


class ParagraphParser(HTMLParser):
    """Keep readable article paragraphs and ignore presentation markup."""

    def __init__(self):
        super().__init__()
        self.paragraphs = []
        self.current = None
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"figure", "pre", "code", "h1", "h2", "h3", "h4", "h5", "h6", "li"}:
            self.skip += 1
        elif tag == "p" and not self.skip:
            self.current = []

    def handle_endtag(self, tag):
        if tag in {"figure", "pre", "code", "h1", "h2", "h3", "h4", "h5", "h6", "li"}:
            self.skip = max(0, self.skip - 1)
        elif tag == "p" and self.current and not self.skip:
            text = " ".join("".join(self.current).split())
            if len(text) >= 40:
                self.paragraphs.append(text)
            self.current = []

    def handle_data(self, data):
        if self.current is not None and not self.skip:
            self.current.append(data)


def summarize(html: str) -> str:
    """Use the first two substantive article paragraphs as the summary."""
    parser = ParagraphParser()
    parser.feed(html)
    summary = " ".join(parser.paragraphs[:2])
    return summary[:500].rstrip() + ("..." if len(summary) > 500 else "")


def categorize(categories: list[str]) -> str:
    """Map category tags to a topic section key."""
    if "branching-strategy" in categories:
        return "linux-networking"
    if "security" in categories or "github-actions" in categories:
        return "security-github"
    if "mcp-server" in categories and "github" in categories:
        return "security-github"
    for section, keywords in CATEGORY_MAP.items():
        for cat in categories:
            if cat in keywords:
                return section
    return "linux-networking"  # fallback


def fetch_medium_posts() -> list[dict]:
    """Fetch and parse Medium RSS feed, return list of post dicts."""
    req = Request(MEDIUM_FEED, headers={"User-Agent": "llms-txt-sync/1.0"})
    with urlopen(req) as resp:
        xml_data = resp.read()

    root = ET.fromstring(xml_data)
    items = root.findall(".//item")
    posts = []

    for item in items[:MAX_POSTS]:
        title = item.findtext("title", "")
        link = item.findtext("link", "")
        link = link.split("?")[0]  # strip RSS query params
        categories = [c.text for c in item.findall("category") if c.text]

        # Extract content from content:encoded
        content_raw = item.findtext(
            "{http://purl.org/rss/1.0/modules/content/}encoded", ""
        )
        if not content_raw:
            content_raw = item.findtext("description", "")

        summary = summarize(content_raw)

        posts.append(
            {
                "title": title,
                "link": link,
                "categories": categories,
                "summary": summary,
                "section": categorize(categories),
            }
        )

    return posts


def render_llms_txt(posts: list[dict]) -> str:
    """Render the full llms.txt content string."""
    sections = {
        "oci-terraform": [],
        "security-github": [],
        "linux-networking": [],
    }
    for p in posts:
        sections[p["section"]].append(p)

    lines = []
    lines.append("# Walkable LLC")
    lines.append(
        "> Linux engineer and DevOps consultant. Infrastructure projects, container optimization, and systems administration. RHCSA certified."
    )
    lines.append("")
    lines.append("## About")
    lines.append("")
    lines.append(
        "Walkable LLC is operated by Rizky Ramadhani, a Linux engineer and DevOps consultant currently based in Southeast Asia. Former chef turned systems professional. Focus areas: Linux administration, container optimization, cloud infrastructure (OCI), automation (Ansible, Terraform), and monitoring (Grafana)."
    )
    lines.append("")
    lines.append(
        "Certifications: Red Hat Certified System Administrator (RHCSA), Microsoft Azure Fundamentals, CompTIA A+."
    )
    lines.append("")

    section_titles = {
        "oci-terraform": "Articles — OCI & Terraform",
        "security-github": "Articles — Security & GitHub",
        "linux-networking": "Articles — Linux & Networking",
    }

    for key, title in section_titles.items():
        lines.append(f"## {title}")
        lines.append("")
        for p in sections[key]:
            tags = ", ".join(p["categories"])
            lines.append(
                f"- [{p['title']}]({p['link']}) — Tags: {tags}. {p['summary']}"
            )
        lines.append("")

    lines.append("## On-site Blog")
    lines.append("")
    lines.append(
        "- [SSH security hardening and other bits](https://www.walk-llc.com/blog/ssh-hardening) — ufw firewall, fail2ban and configs"
    )
    lines.append(
        "- [Setting up SMTP with Migadu](https://www.walk-llc.com/blog/setting-up-smtp) — Using Migadu, an email service"
    )
    lines.append(
        "- [Setting up Cloudflare](https://www.walk-llc.com/blog/setting-up-cloudflare) — From domain registrar to routes"
    )
    lines.append(
        "- [Troubleshooting: adding a storage bucket to my blog](https://www.walk-llc.com/blog/cache-r2bindings) — Configuring R2 storage bucket on Cloudflare"
    )
    lines.append(
        "- [Integrating Grafana](https://www.walk-llc.com/blog/grafana) — for monitoring purposes"
    )
    lines.append(
        "- [Setting up Slack alerting from Grafana](https://www.walk-llc.com/blog/alerting) — Slack notifications from Grafana"
    )
    lines.append("")

    lines.append("## Projects")
    lines.append("")
    lines.append(
        "- [My $0 Home Lab: Converting an old Windows 10 Laptop into a server](https://www.walk-llc.com/projects/old-laptop-server) — Turning a resource-constrained machine into a headless Ubuntu node"
    )
    lines.append(
        "- [Exploring Virtualisation](https://www.walk-llc.com/projects/exploring-virt) — Using VMWare Fusion"
    )
    lines.append("")

    lines.append("## Certifications")
    lines.append("")
    lines.append("- Red Hat Certified System Administrator (RHCSA), 2025–2028")
    lines.append("- Microsoft Azure Fundamentals, 2025–Present")
    lines.append("- CompTIA A+, 2025–2028")
    lines.append("")

    lines.append("## Contact")
    lines.append("")
    lines.append("- Website: https://www.walk-llc.com")
    lines.append("- Email: [EMAIL]")
    lines.append("- LinkedIn: https://www.linkedin.com/in/rizky-ramadhani3056/")
    lines.append("- GitHub: https://github.com/rzkw")
    lines.append("- Medium: https://medium.com/@walkable-llc")

    return "\n".join(lines) + "\n"


def main():
    posts = fetch_medium_posts()
    new_content = render_llms_txt(posts)

    # Only write if content changed
    if OUTPUT.exists() and OUTPUT.read_text() == new_content:
        print("No changes detected.")
        return

    OUTPUT.write_text(new_content)
    print(f"Updated {OUTPUT} with {len(posts)} Medium posts.")


if __name__ == "__main__":
    main()
