# Reframed Org Projects

![License](https://img.shields.io/badge/license-RFLS--1.0-blue)

## About Reframed Org

**Reframed Org** (also known as **Reframed Team**) develops a suite of innovative, modular, and open software projects.  
Our projects prioritize collaboration, reusability, and clear branding, while maintaining legal and licensing boundaries.

### Mission
- Build high-quality, modular software components for internal and external use.
- Encourage structured collaboration under the **RFLS-1.0 License**.
- Protect the Reframed brand: derivative projects **cannot use "Reframed", "Reframed Org", or "Reframed Team" names** without explicit written permission.

## RFLS-1.0 License

All projects under Reframed Org are licensed under **RFLS-1.0**.  
See the [LICENSE](LICENSE.md) file for details.  
This license allows internal use, modification, and redistribution **only within Reframed Org**.  
Derivative works must respect the naming restrictions.

## Features of Reframed Projects

- Modular architecture across all projects
- Easy to extend and integrate components
- Focus on maintainability and clarity
- Strict branding and contribution rules

## Getting Started

Each project has its own repository. General steps to get started with any project:

```bash
git clone https://github.com/reframedorg/convert-api
cd arc
```
Install dependencies if applicable:
```bash
npm install
```
Start the project:
```bash
npm start
```
Test the project:
```bash
curl -X POST -F "video=@ornek.mkv" -F "format=mp4" http://localhost:3000/convert-video --output sonuc.mp4
```
## Contributing
Contributions are only accepted from Reframed Org members.
Please follow internal guidelines for pull requests, code reviews, and commit messages.
Derivative works outside Reframed Org must not use the Reframed brand.