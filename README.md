# UUDS Aero

A cinematic aviation company concept, built from the supplied company PDF, hangar film and amvlab aircraft models.

## Run

```powershell
npm.cmd install
npm.cmd run dev
```

Open the Local URL printed by Vite. The default port is 5173; Vite selects the next available port if another server is running.

```powershell
npm.cmd test
node scripts/check-assets.mjs
npm.cmd run build
```

## October 27 redesign

- The hangar film uses 192 compressed WebP frames, with damped scroll progress and a bounded decoded-image cache. Both forward and reverse scrolling render frames directly.
- A pinned aircraft story changes the aircraft position, angle, scale and wireframe treatment over three chapters. A350 and A380 models are selectable.
- A second aircraft sequence performs the departure before the contact section and footer.
- Mobile layouts, keyboard navigation, reduced motion, a frame-error poster fallback and a static 3D fallback are included.
- The two reference clips informed the animation and composition; their social-video footage is not embedded in the site.

Company imagery and project facts come from project.pdf. Facility figures are described as design proposals. The contact action links to the existing UUDS website; no form submission service is configured.

Aircraft models and fallback images: amvlab, CC BY 4.0. The site modifies lighting and material presentation. Attribution and license links appear in the footer.

Browser visual QA could not be completed in this environment because no browser connector was available. Numerical motion, frame-error recovery, asset integrity and production build checks are available above.
