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
    destroyEditor();

    try {
      editor = new JSONEditor(editorHolder, {
        schema,
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

  function createExampleSchema(countries) {
    if (!Array.isArray(countries) || !countries.length) {
      return {
        title: 'Contact information',
        description: 'Fallback example schema shown when remote data is unavailable.',
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Full name', minLength: 2 },
          email: { type: 'string', format: 'email', title: 'Email address' }
        }
      };
    }

    return {
      title: 'Remote combobox example',
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
          enum: countries.map(option => option.code),
          options: {
            enum_titles: countries.map(option => `${option.name} (${option.code})`),
            enumSource: [
              {
                source: {
                  url: GIST_URL,
                  pointer: '/countries'
                },
                value: 'code',
                title: '{{item.name}} ({{item.code}})'
              }
            ],
            infoText: 'Options are loaded via AJAX from the GitHub gist.'
          }
        }
      }
    };
  }

  async function initialise() {
    try {
      const response = await fetch(GIST_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch combobox data: ${response.status}`);
      }

      const data = await response.json();
      const countries = Array.isArray(data?.countries) ? data.countries : [];

      exampleSchemaString = JSON.stringify(createExampleSchema(countries), null, 2);
    } catch (error) {
      console.error(error);
      exampleSchemaString = JSON.stringify(createExampleSchema([]), null, 2);
      setSchemaError('Loaded fallback schema because remote options could not be retrieved.');
    }

    schemaInput.value = exampleSchemaString;
    renderEditorFromSchema();
  }

  renderButton.addEventListener('click', renderEditorFromSchema);
  loadExampleButton.addEventListener('click', loadExampleSchema);
  resetFormButton.addEventListener('click', resetForm);

  initialise();
});
