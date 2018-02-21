# spike-directus

[![Build Status](https://travis-ci.org/hypebeast/spike-directus.svg?branch=master)](https://travis-ci.org/hypebeast/spike-directus)

Spike plugin for integrating Directus CMS with a static site.

> **NOTE**: This plugin is in a early development. Use it on your own risk.


## Why should you care?

If you are using the Directus CMS and want to pull your API values in and compile them into a spike static site, this plugin will do some good work for you.

## Installation

```
npm install spike-directus -S
```

## Usage

```javascript
// app.js
const Directus = require('spike-directus')
const htmlStandards = require('reshape-standard')
const DIRECTUS_API = process.env.DIRECTUS_API
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN
const locals = {}

module.exports = {
  plugins: [
    new Directus({
      addDataTo: locals,
      url: DIRECTUS_API,
      apiToken: DIRECTUS_TOKEN,
      contentTypes: [{
        name: 'knifes',
        template: {
          path: 'templates/item.html',
          output: (item) => { return `knifes/${item.slug}.html` }
        }
      }]
    })
  ],
  reshape: htmlStandards({ locals: () => locals })
}
```

> **Note**: Unfortunately, there is no more documentation at the current time. See [spike-rooftop](https://github.com/static-dev/spike-rooftop) for more information. This plugin supports the same config options as _spike-rooftop_ and behaves in the same way.
