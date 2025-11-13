const editorContainer = document.getElementById('editor');
const outputElement = document.getElementById('output');
const submitButton = document.getElementById('submit');
const resetButton = document.getElementById('reset');

const GIST_URL = 'https://gist.githubusercontent.com/zacateras/611ee990ffcd531beb74836a533d0302/raw';

function createEditor(countryOptions) {
  const schema = {
    title: 'Contact details',
    description: 'Fill in your information and choose a country from the remote list.',
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
        title: 'Country',
        enum: countryOptions.map(option => option.code),
        options: {
          enum_titles: countryOptions.map(option => `${option.name} (${option.code})`),
          infoText: 'Values are loaded from a remote gist.'
        }
      }
    }
  };

  return new JSONEditor(editorContainer, {
    schema,
    theme: 'spectre',
    disable_collapse: true,
    disable_edit_json: true,
    disable_properties: true,
    show_errors: 'interaction'
  });
}

async function init() {
  try {
    const response = await fetch(GIST_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch combobox data: ${response.status}`);
    }

    const data = await response.json();
    const countries = Array.isArray(data.countries) ? data.countries : [];

    if (!countries.length) {
      throw new Error('Combobox dataset is empty.');
    }

    const editor = createEditor(countries);

    function updateOutput() {
      const value = editor.getValue();
      outputElement.textContent = JSON.stringify(value, null, 2);
    }

    submitButton.addEventListener('click', updateOutput);
    editor.on('change', () => {
      // Keep output live while editing so users can see JSON updates instantly
      updateOutput();
    });

    resetButton.addEventListener('click', () => {
      editor.setValue({});
      updateOutput();
    });

    updateOutput();
  } catch (error) {
    editorContainer.innerHTML = `<div class="error">${error.message}</div>`;
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', init);
