/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./components/Layout.tsx":
/*!*******************************!*\
  !*** ./components/Layout.tsx ***!
  \*******************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Layout)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _store_languageStore__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../store/languageStore */ \"./store/languageStore.ts\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_store_languageStore__WEBPACK_IMPORTED_MODULE_1__]);\n_store_languageStore__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n/**\n * @file        Composant de mise en page pour le widget SalamBot avec adaptation à la langue.\n * @author      SalamBot Team (contact: salam@chebakia.com)\n * @created     2025-05-21\n * @updated     2025-05-21\n * @project     SalamBot - AI CRM for Moroccan SMEs\n */ \n\nfunction Layout({ children }) {\n    const { currentLanguage } = (0,_store_languageStore__WEBPACK_IMPORTED_MODULE_1__.useLanguageStore)();\n    // Déterminer la direction du texte selon la langue\n    const isRTL = currentLanguage === 'ar' || currentLanguage === 'ar-ma';\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n        className: `min-h-screen transition-all duration-300 ${isRTL ? 'rtl-text' : ''} lang-${currentLanguage}`,\n        dir: isRTL ? 'rtl' : 'ltr',\n        children: children\n    }, void 0, false, {\n        fileName: \"/home/ubuntu/salambot-suite/salambot-suite/apps/widget-web/components/Layout.tsx\",\n        lineNumber: 23,\n        columnNumber: 5\n    }, this);\n}\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9jb21wb25lbnRzL0xheW91dC50c3giLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBOzs7Ozs7Q0FNQztBQUd5RDtBQU0zQyxTQUFTQyxPQUFPLEVBQUVDLFFBQVEsRUFBZTtJQUN0RCxNQUFNLEVBQUVDLGVBQWUsRUFBRSxHQUFHSCxzRUFBZ0JBO0lBRTVDLG1EQUFtRDtJQUNuRCxNQUFNSSxRQUFRRCxvQkFBb0IsUUFBUUEsb0JBQW9CO0lBRTlELHFCQUNFLDhEQUFDRTtRQUNDQyxXQUFXLENBQUMseUNBQXlDLEVBQ25ERixRQUFRLGFBQWEsR0FDdEIsTUFBTSxFQUFFRCxpQkFBaUI7UUFDMUJJLEtBQUtILFFBQVEsUUFBUTtrQkFFcEJGOzs7Ozs7QUFHUCIsInNvdXJjZXMiOlsid2VicGFjazovL0BzYWxhbWJvdC93aWRnZXQtd2ViLy4vY29tcG9uZW50cy9MYXlvdXQudHN4PzNjOGYiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZSAgICAgICAgQ29tcG9zYW50IGRlIG1pc2UgZW4gcGFnZSBwb3VyIGxlIHdpZGdldCBTYWxhbUJvdCBhdmVjIGFkYXB0YXRpb24gw6AgbGEgbGFuZ3VlLlxuICogQGF1dGhvciAgICAgIFNhbGFtQm90IFRlYW0gKGNvbnRhY3Q6IHNhbGFtQGNoZWJha2lhLmNvbSlcbiAqIEBjcmVhdGVkICAgICAyMDI1LTA1LTIxXG4gKiBAdXBkYXRlZCAgICAgMjAyNS0wNS0yMVxuICogQHByb2plY3QgICAgIFNhbGFtQm90IC0gQUkgQ1JNIGZvciBNb3JvY2NhbiBTTUVzXG4gKi9cblxuaW1wb3J0IHsgUmVhY3ROb2RlIH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdXNlTGFuZ3VhZ2VTdG9yZSB9IGZyb20gJy4uL3N0b3JlL2xhbmd1YWdlU3RvcmUnO1xuXG5pbnRlcmZhY2UgTGF5b3V0UHJvcHMge1xuICBjaGlsZHJlbjogUmVhY3ROb2RlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBMYXlvdXQoeyBjaGlsZHJlbiB9OiBMYXlvdXRQcm9wcykge1xuICBjb25zdCB7IGN1cnJlbnRMYW5ndWFnZSB9ID0gdXNlTGFuZ3VhZ2VTdG9yZSgpO1xuICBcbiAgLy8gRMOpdGVybWluZXIgbGEgZGlyZWN0aW9uIGR1IHRleHRlIHNlbG9uIGxhIGxhbmd1ZVxuICBjb25zdCBpc1JUTCA9IGN1cnJlbnRMYW5ndWFnZSA9PT0gJ2FyJyB8fCBjdXJyZW50TGFuZ3VhZ2UgPT09ICdhci1tYSc7XG4gIFxuICByZXR1cm4gKFxuICAgIDxkaXYgXG4gICAgICBjbGFzc05hbWU9e2BtaW4taC1zY3JlZW4gdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwICR7XG4gICAgICAgIGlzUlRMID8gJ3J0bC10ZXh0JyA6ICcnXG4gICAgICB9IGxhbmctJHtjdXJyZW50TGFuZ3VhZ2V9YH1cbiAgICAgIGRpcj17aXNSVEwgPyAncnRsJyA6ICdsdHInfVxuICAgID5cbiAgICAgIHtjaGlsZHJlbn1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdLCJuYW1lcyI6WyJ1c2VMYW5ndWFnZVN0b3JlIiwiTGF5b3V0IiwiY2hpbGRyZW4iLCJjdXJyZW50TGFuZ3VhZ2UiLCJpc1JUTCIsImRpdiIsImNsYXNzTmFtZSIsImRpciJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./components/Layout.tsx\n");

/***/ }),

/***/ "./pages/_app.tsx":
/*!************************!*\
  !*** ./pages/_app.tsx ***!
  \************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _components_Layout__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/Layout */ \"./components/Layout.tsx\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_2__);\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_components_Layout__WEBPACK_IMPORTED_MODULE_1__]);\n_components_Layout__WEBPACK_IMPORTED_MODULE_1__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n/**\n * @file        Mise à jour du fichier _app.tsx pour intégrer le Layout avec adaptation à la langue.\n * @author      SalamBot Team (contact: salam@chebakia.com)\n * @created     2025-05-21\n * @updated     2025-05-21\n * @project     SalamBot - AI CRM for Moroccan SMEs\n */ \n\n\nfunction MyApp({ Component, pageProps }) {\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_components_Layout__WEBPACK_IMPORTED_MODULE_1__[\"default\"], {\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n            ...pageProps\n        }, void 0, false, {\n            fileName: \"/home/ubuntu/salambot-suite/salambot-suite/apps/widget-web/pages/_app.tsx\",\n            lineNumber: 16,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/home/ubuntu/salambot-suite/salambot-suite/apps/widget-web/pages/_app.tsx\",\n        lineNumber: 15,\n        columnNumber: 5\n    }, this);\n}\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyApp);\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7O0NBTUM7QUFHeUM7QUFDWDtBQUUvQixTQUFTQyxNQUFNLEVBQUVDLFNBQVMsRUFBRUMsU0FBUyxFQUFZO0lBQy9DLHFCQUNFLDhEQUFDSCwwREFBTUE7a0JBQ0wsNEVBQUNFO1lBQVcsR0FBR0MsU0FBUzs7Ozs7Ozs7Ozs7QUFHOUI7QUFFQSxpRUFBZUYsS0FBS0EsRUFBQyIsInNvdXJjZXMiOlsid2VicGFjazovL0BzYWxhbWJvdC93aWRnZXQtd2ViLy4vcGFnZXMvX2FwcC50c3g/MmZiZSJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlICAgICAgICBNaXNlIMOgIGpvdXIgZHUgZmljaGllciBfYXBwLnRzeCBwb3VyIGludMOpZ3JlciBsZSBMYXlvdXQgYXZlYyBhZGFwdGF0aW9uIMOgIGxhIGxhbmd1ZS5cbiAqIEBhdXRob3IgICAgICBTYWxhbUJvdCBUZWFtIChjb250YWN0OiBzYWxhbUBjaGViYWtpYS5jb20pXG4gKiBAY3JlYXRlZCAgICAgMjAyNS0wNS0yMVxuICogQHVwZGF0ZWQgICAgIDIwMjUtMDUtMjFcbiAqIEBwcm9qZWN0ICAgICBTYWxhbUJvdCAtIEFJIENSTSBmb3IgTW9yb2NjYW4gU01Fc1xuICovXG5cbmltcG9ydCB0eXBlIHsgQXBwUHJvcHMgfSBmcm9tICduZXh0L2FwcCc7XG5pbXBvcnQgTGF5b3V0IGZyb20gJy4uL2NvbXBvbmVudHMvTGF5b3V0JztcbmltcG9ydCAnLi4vc3R5bGVzL2dsb2JhbHMuY3NzJztcblxuZnVuY3Rpb24gTXlBcHAoeyBDb21wb25lbnQsIHBhZ2VQcm9wcyB9OiBBcHBQcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxMYXlvdXQ+XG4gICAgICA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IC8+XG4gICAgPC9MYXlvdXQ+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IE15QXBwO1xuIl0sIm5hbWVzIjpbIkxheW91dCIsIk15QXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./pages/_app.tsx\n");

/***/ }),

/***/ "./store/languageStore.ts":
/*!********************************!*\
  !*** ./store/languageStore.ts ***!
  \********************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {\n__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   useLanguageStore: () => (/* binding */ useLanguageStore)\n/* harmony export */ });\n/* harmony import */ var zustand__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! zustand */ \"zustand\");\nvar __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([zustand__WEBPACK_IMPORTED_MODULE_0__]);\nzustand__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];\n/**\n * @file        Store Zustand pour la gestion de la langue dans le widget SalamBot.\n * @author      SalamBot Team (contact: salam@chebakia.com)\n * @created     2025-05-21\n * @updated     2025-05-21\n * @project     SalamBot - AI CRM for Moroccan SMEs\n */ \nconst useLanguageStore = (0,zustand__WEBPACK_IMPORTED_MODULE_0__.create)((set)=>({\n        // État initial\n        currentLanguage: 'fr',\n        lastDetection: null,\n        // Actions\n        setLanguage: (lang)=>set({\n                currentLanguage: lang\n            }),\n        setDetectionResult: (result)=>set({\n                lastDetection: result,\n                currentLanguage: result.lang\n            })\n    }));\n\n__webpack_async_result__();\n} catch(e) { __webpack_async_result__(e); } });//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zdG9yZS9sYW5ndWFnZVN0b3JlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7OztDQU1DLEdBRWdDO0FBYTFCLE1BQU1DLG1CQUFtQkQsK0NBQU1BLENBQWdCLENBQUNFLE1BQVM7UUFDOUQsZUFBZTtRQUNmQyxpQkFBaUI7UUFDakJDLGVBQWU7UUFFZixVQUFVO1FBQ1ZDLGFBQWEsQ0FBQ0MsT0FBU0osSUFBSTtnQkFBRUMsaUJBQWlCRztZQUFLO1FBQ25EQyxvQkFBb0IsQ0FBQ0MsU0FBV04sSUFBSTtnQkFDbENFLGVBQWVJO2dCQUNmTCxpQkFBaUJLLE9BQU9GLElBQUk7WUFDOUI7SUFDRixJQUFJIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQHNhbGFtYm90L3dpZGdldC13ZWIvLi9zdG9yZS9sYW5ndWFnZVN0b3JlLnRzPzkzYTAiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZSAgICAgICAgU3RvcmUgWnVzdGFuZCBwb3VyIGxhIGdlc3Rpb24gZGUgbGEgbGFuZ3VlIGRhbnMgbGUgd2lkZ2V0IFNhbGFtQm90LlxuICogQGF1dGhvciAgICAgIFNhbGFtQm90IFRlYW0gKGNvbnRhY3Q6IHNhbGFtQGNoZWJha2lhLmNvbSlcbiAqIEBjcmVhdGVkICAgICAyMDI1LTA1LTIxXG4gKiBAdXBkYXRlZCAgICAgMjAyNS0wNS0yMVxuICogQHByb2plY3QgICAgIFNhbGFtQm90IC0gQUkgQ1JNIGZvciBNb3JvY2NhbiBTTUVzXG4gKi9cblxuaW1wb3J0IHsgY3JlYXRlIH0gZnJvbSAnenVzdGFuZCc7XG5pbXBvcnQgeyBMYW5nUmVzdWx0IH0gZnJvbSAnLi4vdXRpbHMvbGFuZy1kZXRlY3QtbW9jayc7XG5cbmludGVyZmFjZSBMYW5ndWFnZVN0YXRlIHtcbiAgLy8gw4l0YXQgYWN0dWVsXG4gIGN1cnJlbnRMYW5ndWFnZTogJ2ZyJyB8ICdhcicgfCAnYXItbWEnIHwgJ3Vua25vd24nO1xuICBsYXN0RGV0ZWN0aW9uOiBMYW5nUmVzdWx0IHwgbnVsbDtcbiAgXG4gIC8vIEFjdGlvbnNcbiAgc2V0TGFuZ3VhZ2U6IChsYW5nOiAnZnInIHwgJ2FyJyB8ICdhci1tYScgfCAndW5rbm93bicpID0+IHZvaWQ7XG4gIHNldERldGVjdGlvblJlc3VsdDogKHJlc3VsdDogTGFuZ1Jlc3VsdCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGNvbnN0IHVzZUxhbmd1YWdlU3RvcmUgPSBjcmVhdGU8TGFuZ3VhZ2VTdGF0ZT4oKHNldCkgPT4gKHtcbiAgLy8gw4l0YXQgaW5pdGlhbFxuICBjdXJyZW50TGFuZ3VhZ2U6ICdmcicsXG4gIGxhc3REZXRlY3Rpb246IG51bGwsXG4gIFxuICAvLyBBY3Rpb25zXG4gIHNldExhbmd1YWdlOiAobGFuZykgPT4gc2V0KHsgY3VycmVudExhbmd1YWdlOiBsYW5nIH0pLFxuICBzZXREZXRlY3Rpb25SZXN1bHQ6IChyZXN1bHQpID0+IHNldCh7XG4gICAgbGFzdERldGVjdGlvbjogcmVzdWx0LFxuICAgIGN1cnJlbnRMYW5ndWFnZTogcmVzdWx0LmxhbmdcbiAgfSksXG59KSk7XG4iXSwibmFtZXMiOlsiY3JlYXRlIiwidXNlTGFuZ3VhZ2VTdG9yZSIsInNldCIsImN1cnJlbnRMYW5ndWFnZSIsImxhc3REZXRlY3Rpb24iLCJzZXRMYW5ndWFnZSIsImxhbmciLCJzZXREZXRlY3Rpb25SZXN1bHQiLCJyZXN1bHQiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./store/languageStore.ts\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ }),

/***/ "zustand":
/*!**************************!*\
  !*** external "zustand" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = import("zustand");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./pages/_app.tsx"));
module.exports = __webpack_exports__;

})();