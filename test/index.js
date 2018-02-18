require('dotenv').config({ silent: true })

const test = require('ava')
const Directus = require('..')
// const Spike = require('spike-core')
// const path = require('path')
// const fs = require('fs')
// const rimraf = require('rimraf')
// const htmlStandards = require('spike-html-standards')

test('errors without a "url"', (t) => {
  t.throws(
    () => { new Directus() }, // eslint-disable-line
    'ValidationError: [spike-directus constructor] option "url" is required'
  )
})

test('errors without a "apiToken"', (t) => {
  t.throws(
    () => { new Directus({ url: 'xxx' }) }, // eslint-disable-line
    'ValidationError: [spike-directus constructor] option "apiToken" is required'
  )
})

test('errors without a "addDataTo"', (t) => {
  t.throws(
    () => { new Directus({ url: 'xxx', apiToken: 'xxx' }) }, // eslint-disable-line
    'ValidationError: [spike-directus constructor] option "addDataTo" is required'
  )
})

test('initializes with a name, apiToken, and addDataTo', (t) => {
  const rt = new Directus({ url: 'xxx', apiToken: 'xxx', addDataTo: {} })
  t.truthy(rt)
})
