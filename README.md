# Josh Faskowitz Website

Personal academic website for Josh Faskowitz.

Live site: <https://faskowit.github.io/>

Built with [Jekyll](https://jekyllrb.com/) using the [al-folio](https://github.com/alshedivat/al-folio) theme.

## Editing Content

- About page: [`_pages/about.md`](_pages/about.md)
- CV data: [`_data/cv.yml`](_data/cv.yml)
- Publications: [`_bibliography/papers.bib`](_bibliography/papers.bib)
- Projects: [`_projects/`](_projects/)
- Notes: [`_posts/`](_posts/)
- News: [`_news/`](_news/)
- Repository cards: [`_data/repositories.yml`](_data/repositories.yml)
- Co-authors: [`_data/coauthors.yml`](_data/coauthors.yml)

## Static Assets

- Images: [`assets/img/`](assets/img/)
- PDFs: [`assets/pdf/`](assets/pdf/)
- CV rendering assets: [`assets/rendercv/`](assets/rendercv/)

## Local Development

Typical local workflow from the repo root:

```bash
docker compose up
```

If you are using the devcontainer or local Ruby setup, use the commands already configured for this repo.

## Notes

- This repository is the source for the live website, not the upstream theme repository.
- Site-specific content and configuration live here.
- Agent and automation instructions are kept separately in [`AGENTS.md`](AGENTS.md).
