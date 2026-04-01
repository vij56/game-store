# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Google AdSense Side Rails

The app now supports left and right AdSense rails on wide screens.

Create a `.env` file inside `frontend/` with:

```env
VITE_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
VITE_ADSENSE_LEFT_SLOT=1234567890
VITE_ADSENSE_RIGHT_SLOT=0987654321
VITE_ADSENSE_LEFT_TOP_SLOT=1234567890
VITE_ADSENSE_LEFT_BOTTOM_SLOT=1234567890
VITE_ADSENSE_RIGHT_TOP_SLOT=0987654321
VITE_ADSENSE_RIGHT_BOTTOM_SLOT=0987654321
VITE_ADSENSE_MOBILE_TOP_SLOT=1111111111
VITE_ADSENSE_MOBILE_BOTTOM_SLOT=2222222222
```

Notes:

- Side rails are shown only on large screens (`>1440px`).
- Desktop side rails now render 4 boxes total (2 on left, 2 on right).
- If `*_TOP_SLOT`/`*_BOTTOM_SLOT` are not set, each side falls back to `VITE_ADSENSE_LEFT_SLOT` and `VITE_ADSENSE_RIGHT_SLOT`.
- On smaller screens, side rails are hidden and top/bottom mobile ad slots are shown.
- If env values are missing, a placeholder card is shown instead of live ads.
