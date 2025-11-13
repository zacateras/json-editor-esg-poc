const GIST_URL = 'https://gist.githubusercontent.com/zacateras/611ee990ffcd531beb74836a533d0302/raw';

document.addEventListener('DOMContentLoaded', () => {
  const schemaInput = document.getElementById('schema-input');
  const renderButton = document.getElementById('render-schema');
  const loadExampleButton = document.getElementById('load-example');
  const resetFormButton = document.getElementById('reset-form');
  const editorHolder = document.getElementById('editor-holder');
  const outputElement = document.getElementById('output');
  const schemaError = document.getElementById('schema-error');

  if (typeof JSONEditor === 'undefined') {
    schemaError.textContent = 'JSON Editor library failed to load. Please refresh the page.';
    renderButton.disabled = true;
    loadExampleButton.disabled = true;
    resetFormButton.disabled = true;
    return;
  }

  let editor = null;
  let editorInitialValue = {};
  let exampleSchemaString = '';
  let editorReady = false;

  JSONEditor.defaults.options.theme = 'spectre';
  JSONEditor.defaults.options.iconlib = 'spectre';
  JSONEditor.defaults.options.ajax = true;

  const dataTokens = {
    countries: [],
    countryCodes: [],
    countryTitles: []
  };

  function cloneValue(value) {
    if (value === undefined) {
      return value;
    }

    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(value);
      } catch (error) {
        console.warn('structuredClone failed for value, falling back to JSON clone', error);
      }
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      console.error('Failed to clone value for data token substitution', error);
      return value;
    }
  }

  function registerCountryTokens(countries) {
    const normalized = Array.isArray(countries)
      ? countries
          .map(option => {
            if (!option || typeof option !== 'object') {
              return null;
            }

            const name = typeof option.name === 'string' ? option.name.trim() : '';
            const code = typeof option.code === 'string' ? option.code.trim() : '';
            const region = typeof option.region === 'string' ? option.region : option.region ?? null;

            if (!name || !code) {
              return null;
            }

            return { name, code, region };
          })
          .filter(Boolean)
      : [];

    dataTokens.countries = normalized;
    dataTokens.countryCodes = normalized.map(option => option.code);
    dataTokens.countryTitles = normalized.map(option => `${option.name} (${option.code})`);
  }

  function isDataTokenObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    if (!Object.prototype.hasOwnProperty.call(value, '$data')) {
      return false;
    }

    return Object.keys(value).every(key => key === '$data' || key === '$fallback');
  }

  function resolveDataTokens(value, missingTokens) {
    if (Array.isArray(value)) {
      return value.map(item => resolveDataTokens(item, missingTokens));
    }

    if (isDataTokenObject(value)) {
      const tokenKey = typeof value.$data === 'string' ? value.$data.trim() : '';

      if (!tokenKey) {
        if (missingTokens) {
          missingTokens.add('(invalid $data token)');
        }

        if (Object.prototype.hasOwnProperty.call(value, '$fallback')) {
          return resolveDataTokens(value.$fallback, missingTokens);
        }

        return null;
      }

      if (!Object.prototype.hasOwnProperty.call(dataTokens, tokenKey)) {
        if (missingTokens) {
          missingTokens.add(tokenKey);
        }

        if (Object.prototype.hasOwnProperty.call(value, '$fallback')) {
          return resolveDataTokens(value.$fallback, missingTokens);
        }

        return null;
      }

      return cloneValue(dataTokens[tokenKey]);
    }

    if (value && typeof value === 'object') {
      const resolved = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        resolved[key] = resolveDataTokens(nestedValue, missingTokens);
      }
      return resolved;
    }

    return value;
  }

  function setSchemaError(message = '') {
    schemaError.textContent = message;
  }

  function destroyEditor() {
    if (editor) {
      try {
        editor.destroy();
      } catch (error) {
        console.error('Failed to destroy editor instance', error);
      }
    }
    editor = null;
    editorReady = false;
    editorHolder.innerHTML = '';
    outputElement.textContent = '{}';
    editorInitialValue = {};
  }

  function updateOutput() {
    if (!editor || !editorReady) {
      outputElement.textContent = '{}';
      return;
    }

    try {
      const value = editor.getValue();
      outputElement.textContent = JSON.stringify(value, null, 2);
    } catch (error) {
      console.error('Failed to read editor value', error);
    }
  }

  function renderEditorFromSchema() {
    const rawSchema = schemaInput.value.trim();
    if (!rawSchema) {
      setSchemaError('Please provide a JSON Schema to render.');
      destroyEditor();
      return;
    }

    let schema;
    try {
      schema = JSON.parse(rawSchema);
    } catch (error) {
      setSchemaError(`Schema is not valid JSON: ${error.message}`);
      destroyEditor();
      return;
    }

    setSchemaError('');

    const missingTokens = new Set();
    const schemaWithData = resolveDataTokens(schema, missingTokens);

    if (missingTokens.size > 0) {
      setSchemaError(
        `Schema references unknown data tokens: ${Array.from(missingTokens)
          .sort()
          .join(', ')}`
      );
      destroyEditor();
      return;
    }

    destroyEditor();

    try {
      editor = new JSONEditor(editorHolder, {
        schema: schemaWithData,
        ajax: true,
        disable_collapse: true,
        disable_properties: true,
        show_errors: 'interaction'
      });
    } catch (error) {
      console.error('Failed to render schema', error);
      setSchemaError(`Failed to render schema: ${error.message}`);
      destroyEditor();
      return;
    }

    editorReady = false;

    editor.on('ready', () => {
      editorReady = true;
      try {
        editorInitialValue = editor.getValue();
      } catch (error) {
        console.error('Failed to store initial value', error);
        editorInitialValue = {};
      }
      updateOutput();
    });

    editor.on('change', () => {
      if (!editorReady) {
        return;
      }
      updateOutput();
    });
  }

  function loadExampleSchema() {
    if (!exampleSchemaString) {
      console.warn('Example schema has not finished loading yet.');
      return;
    }

    schemaInput.value = exampleSchemaString;
    renderEditorFromSchema();
  }

  function resetForm() {
    if (!editor || !editorReady) {
      outputElement.textContent = '{}';
      return;
    }

    try {
      editor.setValue(editorInitialValue || {});
    } catch (error) {
      console.error('Failed to reset form', error);
    }
  }

  function createExampleSchema(hasRemoteData) {
    const fallbackCountry = { name: 'Sample Country', code: 'XX' };
    const fallbackCountryTitle = `${fallbackCountry.name} (${fallbackCountry.code})`;

    const schema = {
      title: 'Token-driven combobox example',
      description:
        'Demonstrates how {"$data": "..."} tokens hydrate datasets fetched in app.js before the editor renders.',
      type: 'object',
      required: ['name', 'email', 'country'],
      properties: {
        name: {
          type: 'string',
          title: 'Full name',
          minLength: 2,
          options: {
            inputAttributes: {
              placeholder: 'Ada Lovelace'
            }
          }
        },
        email: {
          type: 'string',
          format: 'email',
          title: 'Email address',
          options: {
            inputAttributes: {
              placeholder: 'ada@example.com'
            }
          }
        },
        country: {
          type: 'string',
          format: 'select',
          title: 'Country',
          enum: {
            $data: 'countryCodes',
            $fallback: [fallbackCountry.code]
          },
          options: {
            enum_titles: {
              $data: 'countryTitles',
              $fallback: [fallbackCountryTitle]
            },
            enumSource: [
              {
                source: {
                  $data: 'countries',
                  $fallback: [fallbackCountry]
                },
                value: 'code',
                title: '{{item.name}} ({{item.code}})'
              }
            ],
            inputAttributes: {
              placeholder: 'Select a country'
            },
            infoText: hasRemoteData
              ? 'Options are hydrated from the prefetched countries dataset via data tokens.'
              : 'Remote dataset unavailable. Fallback values keep the select usable until data loads.'
          }
        }
      }
    };

    if (!hasRemoteData) {
      schema.description += ' The fallback data ensures the select remains interactive when the remote request fails.';
    }

    return schema;
  }

  async function initialise() {
    let postRenderMessage = '';

    try {
      const response = await fetch(GIST_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch combobox data: ${response.status}`);
      }

      const data = await response.json();
      const countries = Array.isArray(data?.countries) ? data.countries : [];

      registerCountryTokens(countries);

      const hasRemoteData = dataTokens.countries.length > 0;
      exampleSchemaString = JSON.stringify(createExampleSchema(hasRemoteData), null, 2);

      if (!hasRemoteData) {
        postRenderMessage = 'Remote dataset returned no countries. Fallback values are being used for the select control.';
      }
    } catch (error) {
      console.error(error);
      registerCountryTokens([]);
      exampleSchemaString = JSON.stringify(createExampleSchema(false), null, 2);
      postRenderMessage = 'Loaded fallback schema because remote options could not be retrieved.';
    }

    schemaInput.value = exampleSchemaString;
    renderEditorFromSchema();

    if (postRenderMessage && !schemaError.textContent) {
      setSchemaError(postRenderMessage);
    }
  }

  renderButton.addEventListener('click', renderEditorFromSchema);
  loadExampleButton.addEventListener('click', loadExampleSchema);
  resetFormButton.addEventListener('click', resetForm);

  initialise();
});
