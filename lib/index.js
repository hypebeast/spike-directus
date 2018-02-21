const Client = require('directus-sdk-javascript/remote')
const Joi = require('joi')
const W = require('when')
const SpikeUtil = require('spike-util')
const bindAllClass = require('es6bindall')

class Directus {
  constructor (opts) {
    const validatedOptions = this.validate(opts)
    Object.assign(this, validatedOptions)
    this.client = new Client({
      url: this.url,
      accessToken: this.apiToken
    })
    bindAllClass(this, ['apply', 'run'])
  }

  apply (compiler) {
    this.util = new SpikeUtil(compiler.options)
    this.util.runAll(compiler, this.run)
    let templatePairs

    compiler.plugin('before-loader-process', (ctx, options) => {
      // map each template path to its config position
      if (!templatePairs) {
        templatePairs = this.contentTypes.reduce((m, model, idx) => {
          if (!model.template) {
            return m
          }

          if (!model.template.path) {
            throw new Error(
              `${model.name}.template must have a 'path' property`
            )
          }

          if (!model.template.output) {
            throw new Error(
              `${model.name}.template must have a 'output' function`
            )
          }

          m[model.template.path] = idx
          return m
        }, {})
      }

      // get the relative path of the file currently being compiled
      const p = ctx.resourcePath.replace(`${compiler.options.context}/`, '')

      // match this path to the template pairs to get the model's full config
      if (typeof templatePairs[p] === 'undefined') {
        return options
      }

      const conf = this.contentTypes[templatePairs[p]]
      const data = this.addDataTo.directus[conf.name]

      // add a reshape multi option to compile each template separately
      options.multi = data.map(d => {
        return {
          locals: Object.assign({}, this.addDataTo, { item: d }),
          name: conf.template.output(d)
        }
      })

      return options
    })

    compiler.plugin('emit', (compilation, done) => {
      // write data to json file
      if (this.json) {
        const src = JSON.stringify(this.addDataTo.directus, null, 2)
        compilation.assets[this.json] = {
          source: () => src,
          size: () => src.length
        }
      }

      done()
    })
  }

  run (compilation, done) {
    return W.reduce(this.contentTypes, (m, ct) => {
      let name
      let options
      let transformFn

      if (typeof ct === 'string') {
        name = ct
        options = {}
        transformFn = true
      } else {
        name = ct.name
        options = ct.params
        transformFn = ct.transform
      }

      if (typeof transformFn === 'boolean') {
        transformFn = transformFn ? this.transform : (x) => x
      }

      return W.resolve(this.client.getItems(name, options))
        .then((res) => W.map(res.data, transformFn))
        .tap((v) => { m[name] = v })
        .yield(m)
    }, {}).done((res) => {
      let modData = {}

      // call hooks if specified
      if (this.hooks && this.hooks.postTransform) {
        [res, modData] = this.hooks.postTransform(res, this.addDataTo)
        this.addDataTo = Object.assign(this.addDataTo, modData)
      }

      // just add data to locals
      this.addDataTo = Object.assign(this.addDataTo, { directus: res })

      done()
    }, done)
  }

  transform (x) {
    return x
  }

  validate (opts = {}) {
    const schema = Joi.object().keys({
      url: Joi.string().required(),
      apiToken: Joi.string().required(),
      addDataTo: Joi.object().required(),
      contentTypes: Joi.array().items(
        Joi.string(), Joi.object().keys({
          name: Joi.string(),
          transform: Joi.alternatives().try(Joi.boolean(), Joi.func()).default(true)
        })
      ).default(['posts'])
    })

    const res = Joi.validate(opts, schema, {
      allowUnknown: true,
      language: {
        messages: { wrapArrays: false },
        object: { child: '!![spike-directus constructor] option {{reason}}' }
      }
    })

    if (res.error) {
      throw new Error(res.error)
    }

    return res.value
  }
}

module.exports = Directus
