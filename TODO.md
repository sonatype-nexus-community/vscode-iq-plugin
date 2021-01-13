# Remaining tasks to work on

- [X] do a full policy scan (instead of getting component details)
- [X] update with license (and security) threat icons
- [x] add hover-help with more details about the component and violations found
- [X] on double-click (or something) open a webview page
- [X] set the webview page to use violation details (eg: Chrome plugin, other IDEs)
- [X] automatically sort the components based on violation status
- [] enable viewing component details for all components, not just the security violations
- [] add "compile error" warnings in the package.json file based on violations
- [] add a tree view to show all transitive dependencies and how they relate to top-level components
   - https://www.npmjs.com/package/dependency-tree  ? (module-based, may not be what we want)
- [X] add a configuration window to set user/password/host details for IQ server
- [] automatically re-run scan whenever package.json, npm-shrinkwrap.json or package-lock.json gets changed
- [] add license violations to the "problems" tab, as compile-style errors

# Wishlist

- [] improve asynch calls to do more parallelism
- [] dynamically update UI as scans are performed

# Issues

- VSCode can't load arbitrary remote content. It doesn't have a URL so all relative links are broken. There's a request to
  provide this support https://github.com/Microsoft/vscode/issues/70339 but it does not like it's actively worked on
