# Contributing to Nexus IQ Plugin for VS Code

## Adding a format

1) Run `FORMAT=Maven npm run generate-format`, substituting the value for FORMAT for the name of the Format you are working on, example: `Maven` in this case
2) Implement the methods you need to in these newly generated classes, and then in `ext-src/packages/ComponentContainer.ts`, add your Implementation!