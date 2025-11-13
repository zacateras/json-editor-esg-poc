const EMBEDDED_DICTIONARIES = {
  country: [
    { id: 'country_us', code: 'US', description: 'United States of America' },
    { id: 'country_gb', code: 'GB', description: 'United Kingdom' },
    { id: 'country_de', code: 'DE', description: 'Germany' },
    { id: 'country_jp', code: 'JP', description: 'Japan' },
    { id: 'country_br', code: 'BR', description: 'Brazil' },
    { id: 'country_za', code: 'ZA', description: 'South Africa' }
  ],
  currency: [
    { id: 'currency_usd', code: 'USD', description: 'US Dollar' },
    { id: 'currency_eur', code: 'EUR', description: 'Euro' },
    { id: 'currency_gbp', code: 'GBP', description: 'Pound Sterling' },
    { id: 'currency_jpy', code: 'JPY', description: 'Japanese Yen' },
    { id: 'currency_brl', code: 'BRL', description: 'Brazilian Real' },
    { id: 'currency_zar', code: 'ZAR', description: 'South African Rand' }
  ],
  esg_metric: [
    { id: 'metric_carbon_intensity', code: 'CARBON_INTENSITY', description: 'Operational carbon intensity (tCO2e/USDm revenue)' },
    { id: 'metric_water_usage', code: 'WATER_USAGE', description: 'Total freshwater withdrawal (m³)' },
    { id: 'metric_diversity_ratio', code: 'DIVERSITY_RATIO', description: 'Women in leadership ratio (%)' },
    { id: 'metric_renewable_energy', code: 'RENEWABLE_ENERGY', description: 'Renewable energy share (%)' },
    { id: 'metric_waste_recycled', code: 'WASTE_RECYCLED', description: 'Waste recycled (%)' }
  ],
  asset_class: [
    { id: 'asset_equity', code: 'EQUITY', description: 'Listed equity holdings' },
    { id: 'asset_fixed_income', code: 'FIXED_INCOME', description: 'Fixed income securities' },
    { id: 'asset_real_assets', code: 'REAL_ASSETS', description: 'Real assets and infrastructure' },
    { id: 'asset_private_equity', code: 'PRIVATE_EQUITY', description: 'Private equity investments' },
    { id: 'asset_cash', code: 'CASH', description: 'Cash and cash equivalents' }
  ],
  sustainability_rating: [
    { id: 'rating_low', code: 'LOW', description: 'Low ESG risk' },
    { id: 'rating_moderate', code: 'MODERATE', description: 'Moderate ESG risk' },
    { id: 'rating_high', code: 'HIGH', description: 'High ESG risk' },
    { id: 'rating_severe', code: 'SEVERE', description: 'Severe ESG risk' }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const schemaInput = document.getElementById('schema-input');
  const renderButton = document.getElementById('render-schema');
  const loadExampleButton = document.getElementById('load-example');
  const exampleSelect = document.getElementById('example-select');
  const exampleDescription = document.getElementById('example-description');
  const resetFormButton = document.getElementById('reset-form');
  const editorHolder = document.getElementById('editor-holder');
  const outputElement = document.getElementById('output');
  const schemaError = document.getElementById('schema-error');

  if (typeof JSONEditor === 'undefined') {
    schemaError.textContent = 'JSON Editor library failed to load. Please refresh the page.';
    renderButton.disabled = true;
    loadExampleButton.disabled = true;
    resetFormButton.disabled = true;
    if (exampleSelect) {
      exampleSelect.disabled = true;
    }
    return;
  }

  let editor = null;
  let editorInitialValue = {};
  let editorReady = false;

  JSONEditor.defaults.options.theme = 'spectre';
  JSONEditor.defaults.options.iconlib = 'spectre';
  JSONEditor.defaults.options.ajax = true;

  const dataTokens = {};

  function cloneValue(value) {
    if (value === undefined) {
      return value;
    }

    if (typeof structuredClone === 'function') {
      try {
        return structuredClone(value);
      } catch (error) {
        console.warn('structuredClone failed, falling back to JSON clone', error);
      }
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      console.error('Failed to clone value for data token substitution', error);
      return value;
    }
  }

  function registerDictionaryTokens() {
    const dictionaryNames = Object.keys(EMBEDDED_DICTIONARIES);
    dataTokens['dict.names'] = cloneValue(dictionaryNames);

    dictionaryNames.forEach(name => {
      const entries = EMBEDDED_DICTIONARIES[name].map(entry => ({ ...entry }));
      const codes = entries.map(entry => entry.code);
      const descriptions = entries.map(entry => `${entry.code} — ${entry.description}`);
      const lookupByCode = entries.reduce((acc, entry) => {
        acc[entry.code] = { ...entry };
        return acc;
      }, {});

      dataTokens[`dict.${name}`] = cloneValue(entries);
      dataTokens[`dict.${name}.codes`] = cloneValue(codes);
      dataTokens[`dict.${name}.descriptions`] = cloneValue(descriptions);
      dataTokens[`dict.${name}.byCode`] = cloneValue(lookupByCode);
      dataTokens[`dict.${name}.options`] = cloneValue(
        entries.map(entry => ({
          value: entry.code,
          title: `${entry.code} — ${entry.description}`
        }))
      );
    });
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

  function createEnumSourceConfig(dictionaryName, titleTemplate = '{{item.code}} — {{item.description}}') {
    return {
      source: {
        $data: `dict.${dictionaryName}`,
        $fallback: EMBEDDED_DICTIONARIES[dictionaryName].map(entry => ({ ...entry }))
      },
      value: 'code',
      title: titleTemplate
    };
  }

  function dictionaryCodes(dictionaryName) {
    return EMBEDDED_DICTIONARIES[dictionaryName].map(entry => entry.code);
  }

  function dictionaryDescriptions(dictionaryName) {
    return EMBEDDED_DICTIONARIES[dictionaryName].map(
      entry => `${entry.code} — ${entry.description}`
    );
  }

  const SCHEMA_EXAMPLES = [
    {
      id: 'esg-kpi-submission',
      title: 'ESG KPI submission',
      summary:
        'Capture recurring ESG key performance indicators with token-driven metric and currency selections.',
      schema: {
        title: 'Monthly ESG KPI submission',
        description:
          'Submit key environmental, social, and governance metrics with commentary. Metric options are sourced from dict.esg_metric.',
        type: 'object',
        required: ['reporting_period', 'reporting_currency', 'entries'],
        properties: {
          reporting_period: {
            type: 'string',
            title: 'Reporting period',
            format: 'date'
          },
          reporting_currency: {
            type: 'string',
            title: 'Reporting currency',
            options: {
              enumSource: [createEnumSourceConfig('currency')],
              enum_titles: {
                $data: 'dict.currency.descriptions',
                $fallback: dictionaryDescriptions('currency')
              }
            },
            enum: {
              $data: 'dict.currency.codes',
              $fallback: dictionaryCodes('currency')
            }
          },
          entries: {
            type: 'array',
            title: 'Metric entries',
            minItems: 1,
            format: 'table',
            items: {
              type: 'object',
              required: ['metric_code', 'value'],
              properties: {
                metric_code: {
                  type: 'string',
                  title: 'Metric',
                  options: {
                    enumSource: [createEnumSourceConfig('esg_metric')]
                  }
                },
                value: {
                  type: 'number',
                  title: 'Value',
                  minimum: 0
                },
                unit: {
                  type: 'string',
                  title: 'Unit',
                  default: 'auto'
                },
                commentary: {
                  type: 'string',
                  title: 'Commentary',
                  options: {
                    inputAttributes: {
                      placeholder: 'Explain drivers, assumptions, or data quality notes'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      id: 'sustainable-bond-term-sheet',
      title: 'Sustainable bond term sheet',
      summary:
        'Design a labelled bond with use-of-proceeds tags, currency selection, and country of issuance.',
      schema: {
        title: 'Sustainable bond term sheet',
        type: 'object',
        required: ['issuer_name', 'country_of_issuance', 'currency', 'issue_size'],
        properties: {
          issuer_name: {
            type: 'string',
            title: 'Issuer name',
            minLength: 2
          },
          country_of_issuance: {
            type: 'string',
            title: 'Country of issuance',
            options: {
              enumSource: [createEnumSourceConfig('country')]
            }
          },
          currency: {
            type: 'string',
            title: 'Issue currency',
            options: {
              enumSource: [createEnumSourceConfig('currency')]
            }
          },
          issue_size: {
            type: 'number',
            title: 'Issue size (millions)',
            minimum: 1
          },
          maturity_date: {
            type: 'string',
            title: 'Maturity date',
            format: 'date'
          },
          labelled_use_of_proceeds: {
            type: 'array',
            title: 'Use of proceeds tags',
            uniqueItems: true,
            items: {
              type: 'string',
              title: 'Impact theme',
              enum: {
                $data: 'dict.asset_class.codes',
                $fallback: dictionaryCodes('asset_class')
              },
              options: {
                enum_titles: {
                  $data: 'dict.asset_class.descriptions',
                  $fallback: dictionaryDescriptions('asset_class')
                }
              }
            }
          },
          second_party_opinion: {
            type: 'string',
            title: 'Second-party opinion provider'
          }
        }
      }
    },
    {
      id: 'portfolio-allocation-esg',
      title: 'ESG-aware portfolio allocation',
      summary:
        'Allocate assets by class with sustainability ratings and target allocations that must total 100%.',
      schema: {
        title: 'Portfolio allocation with ESG overlays',
        type: 'object',
        required: ['allocations'],
        properties: {
          allocations: {
            type: 'array',
            title: 'Asset allocations',
            minItems: 1,
            items: {
              type: 'object',
              required: ['asset_class', 'target_weight', 'rating'],
              properties: {
                asset_class: {
                  type: 'string',
                  title: 'Asset class',
                  options: {
                    enumSource: [createEnumSourceConfig('asset_class')]
                  }
                },
                target_weight: {
                  type: 'number',
                  title: 'Target weight (%)',
                  minimum: 0,
                  maximum: 100
                },
                rating: {
                  type: 'string',
                  title: 'Sustainability rating',
                  enum: {
                    $data: 'dict.sustainability_rating.codes',
                    $fallback: dictionaryCodes('sustainability_rating')
                  },
                  options: {
                    enum_titles: {
                      $data: 'dict.sustainability_rating.descriptions',
                      $fallback: dictionaryDescriptions('sustainability_rating')
                    }
                  }
                },
                notes: {
                  type: 'string',
                  title: 'Allocation notes'
                }
              }
            }
          },
          total_weight_validation: {
            title: 'Total allocation guidance',
            type: 'string',
            readOnly: true,
            default:
              'Use the JSON Editor validation tab to ensure weights sum to 100%. Custom validation can be implemented externally.'
          }
        }
      }
    },
    {
      id: 'supply-chain-due-diligence',
      title: 'Supply chain due diligence review',
      summary:
        'Screen suppliers with jurisdiction tagging, human-rights risk, and escalation routing.',
      schema: {
        title: 'Supply chain ESG due diligence',
        description:
          'Each supplier is classified with a risk level sourced from dict.sustainability_rating.',
        type: 'object',
        required: ['suppliers'],
        properties: {
          suppliers: {
            type: 'array',
            minItems: 1,
            title: 'Suppliers',
            items: {
              type: 'object',
              required: ['legal_name', 'country', 'risk_level'],
              properties: {
                legal_name: {
                  type: 'string',
                  title: 'Legal name'
                },
                country: {
                  type: 'string',
                  title: 'Country',
                  options: {
                    enumSource: [createEnumSourceConfig('country')]
                  }
                },
                risk_level: {
                  type: 'string',
                  title: 'Risk level',
                  enum: {
                    $data: 'dict.sustainability_rating.codes',
                    $fallback: dictionaryCodes('sustainability_rating')
                  },
                  options: {
                    enum_titles: {
                      $data: 'dict.sustainability_rating.descriptions',
                      $fallback: dictionaryDescriptions('sustainability_rating')
                    }
                  }
                },
                mitigation_plan: {
                  type: 'string',
                  title: 'Mitigation plan',
                  options: {
                    inputAttributes: {
                      placeholder: 'Outline remediation or audit follow-up steps'
                    }
                  }
                },
                next_review_date: {
                  type: 'string',
                  title: 'Next review date',
                  format: 'date'
                }
              }
            }
          }
        }
      }
    },
    {
      id: 'climate-risk-scenario',
      title: 'Climate risk scenario',
      summary:
        'Model scenario assumptions by geography with warming pathway selection and quantitative stress inputs.',
      schema: {
        title: 'Climate scenario analysis',
        type: 'object',
        required: ['scenario_name', 'regions'],
        properties: {
          scenario_name: {
            type: 'string',
            title: 'Scenario name',
            minLength: 3
          },
          warming_pathway: {
            type: 'string',
            title: 'Warming pathway',
            enum: ['1.5°C', '1.7°C', '2°C', '3°C'],
            default: '1.5°C'
          },
          regions: {
            type: 'array',
            title: 'Regions assessed',
            minItems: 1,
            items: {
              type: 'object',
              required: ['country', 'transition_risk', 'physical_risk'],
              properties: {
                country: {
                  type: 'string',
                  title: 'Country',
                  options: {
                    enumSource: [createEnumSourceConfig('country')]
                  }
                },
                transition_risk: {
                  type: 'number',
                  title: 'Transition risk (bps)',
                  minimum: 0,
                  maximum: 500
                },
                physical_risk: {
                  type: 'number',
                  title: 'Physical risk (bps)',
                  minimum: 0,
                  maximum: 500
                },
                adaptation_plan: {
                  type: 'string',
                  title: 'Adaptation plan summary'
                }
              }
            }
          }
        }
      }
    },
    {
      id: 'green-loan-application',
      title: 'Green loan application',
      summary:
        'Collect borrower data for a green loan, with project location, currency, and eligible categories.',
      schema: {
        title: 'Green loan application',
        type: 'object',
        required: ['borrower_name', 'project_location', 'loan_amount', 'currency'],
        properties: {
          borrower_name: {
            type: 'string',
            title: 'Borrower name'
          },
          project_location: {
            type: 'object',
            title: 'Project location',
            required: ['country'],
            properties: {
              country: {
                type: 'string',
                title: 'Country',
                options: {
                  enumSource: [createEnumSourceConfig('country')]
                }
              },
              city: {
                type: 'string',
                title: 'City'
              }
            }
          },
          currency: {
            type: 'string',
            title: 'Facility currency',
            options: {
              enumSource: [createEnumSourceConfig('currency')]
            }
          },
          loan_amount: {
            type: 'number',
            title: 'Requested amount',
            minimum: 0
          },
          eligibility_category: {
            type: 'string',
            title: 'Eligible category',
            enum: {
              $data: 'dict.asset_class.codes',
              $fallback: dictionaryCodes('asset_class')
            },
            options: {
              enum_titles: {
                $data: 'dict.asset_class.descriptions',
                $fallback: dictionaryDescriptions('asset_class')
              }
            }
          },
          impact_targets: {
            type: 'array',
            title: 'Impact targets',
            items: {
              type: 'object',
              required: ['metric', 'baseline'],
              properties: {
                metric: {
                  type: 'string',
                  title: 'Metric',
                  options: {
                    enumSource: [createEnumSourceConfig('esg_metric')]
                  }
                },
                baseline: {
                  type: 'number',
                  title: 'Baseline value',
                  minimum: 0
                },
                target_2030: {
                  type: 'number',
                  title: '2030 target',
                  minimum: 0
                }
              }
            }
          }
        }
      }
    },
    {
      id: 'diversity-disclosure',
      title: 'Diversity disclosure',
      summary:
        'Track diversity metrics with ratios, narrative fields, and compliance attestation.',
      schema: {
        title: 'Diversity & inclusion disclosure',
        type: 'object',
        required: ['reporting_period', 'board_diversity_ratio'],
        properties: {
          reporting_period: {
            type: 'string',
            title: 'Reporting period',
            pattern: '^[0-9]{4}-Q[1-4]$',
            options: {
              inputAttributes: {
                placeholder: 'e.g. 2024-Q1'
              }
            }
          },
          board_diversity_ratio: {
            type: 'number',
            title: 'Board diversity ratio (%)',
            minimum: 0,
            maximum: 100
          },
          leadership_programmes: {
            type: 'array',
            title: 'Leadership programmes',
            items: {
              type: 'object',
              required: ['name', 'country'],
              properties: {
                name: {
                  type: 'string',
                  title: 'Programme name'
                },
                country: {
                  type: 'string',
                  title: 'Country',
                  options: {
                    enumSource: [createEnumSourceConfig('country')]
                  }
                },
                participants: {
                  type: 'integer',
                  title: 'Participants',
                  minimum: 0
                }
              }
            }
          },
          attestation: {
            type: 'boolean',
            title: 'Compliance attestation',
            format: 'checkbox',
            description:
              'Confirm the disclosed data follows internal and regulatory reporting standards.'
          }
        }
      }
    },
    {
      id: 'net-zero-roadmap',
      title: 'Net-zero roadmap milestones',
      summary:
        'Plan decarbonisation milestones by asset class with dictionary-backed metric references.',
      schema: {
        title: 'Net-zero transition roadmap',
        type: 'object',
        required: ['milestones'],
        properties: {
          milestones: {
            type: 'array',
            title: 'Milestones',
            minItems: 1,
            items: {
              type: 'object',
              required: ['year', 'asset_class', 'metric'],
              properties: {
                year: {
                  type: 'integer',
                  title: 'Milestone year',
                  minimum: 2023,
                  maximum: 2050
                },
                asset_class: {
                  type: 'string',
                  title: 'Asset class',
                  options: {
                    enumSource: [createEnumSourceConfig('asset_class')]
                  }
                },
                metric: {
                  type: 'string',
                  title: 'Metric',
                  options: {
                    enumSource: [createEnumSourceConfig('esg_metric')]
                  }
                },
                target_reduction: {
                  type: 'number',
                  title: 'Target reduction (%)',
                  minimum: 0,
                  maximum: 100
                }
              }
            }
          },
          interim_review: {
            type: 'string',
            title: 'Interim review notes'
          }
        }
      }
    },
    {
      id: 'esg-incident-log',
      title: 'ESG incident log',
      summary:
        'Log adverse incidents with country, severity, remediation, and financial impact tracking.',
      schema: {
        title: 'ESG incident register',
        type: 'object',
        required: ['incidents'],
        properties: {
          incidents: {
            type: 'array',
            minItems: 1,
            title: 'Incidents',
            items: {
              type: 'object',
              required: ['reported_on', 'country', 'severity'],
              properties: {
                reported_on: {
                  type: 'string',
                  format: 'date',
                  title: 'Reported on'
                },
                country: {
                  type: 'string',
                  title: 'Country',
                  options: {
                    enumSource: [createEnumSourceConfig('country')]
                  }
                },
                severity: {
                  type: 'string',
                  title: 'Severity',
                  enum: ['LOW', 'MEDIUM', 'HIGH'],
                  default: 'MEDIUM'
                },
                remediation_steps: {
                  type: 'string',
                  title: 'Remediation steps'
                },
                financial_impact: {
                  type: 'number',
                  title: 'Estimated financial impact',
                  minimum: 0
                },
                currency: {
                  type: 'string',
                  title: 'Currency',
                  options: {
                    enumSource: [createEnumSourceConfig('currency')]
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      id: 'sustainable-product-classification',
      title: 'Sustainable product classification',
      summary:
        'Classify financial products with asset class, ESG metric tags, and sustainability ratings.',
      schema: {
        title: 'Sustainable product classification',
        type: 'object',
        required: ['products'],
        properties: {
          products: {
            type: 'array',
            minItems: 1,
            title: 'Products',
            items: {
              type: 'object',
              required: ['product_name', 'asset_class', 'rating'],
              properties: {
                product_name: {
                  type: 'string',
                  title: 'Product name'
                },
                asset_class: {
                  type: 'string',
                  title: 'Asset class',
                  options: {
                    enumSource: [createEnumSourceConfig('asset_class')]
                  }
                },
                rating: {
                  type: 'string',
                  title: 'Sustainability rating',
                  enum: {
                    $data: 'dict.sustainability_rating.codes',
                    $fallback: dictionaryCodes('sustainability_rating')
                  },
                  options: {
                    enum_titles: {
                      $data: 'dict.sustainability_rating.descriptions',
                      $fallback: dictionaryDescriptions('sustainability_rating')
                    }
                  }
                },
                tagged_metrics: {
                  type: 'array',
                  title: 'Tagged metrics',
                  items: {
                    type: 'string',
                    options: {
                      enumSource: [createEnumSourceConfig('esg_metric')]
                    }
                  }
                }
              }
            }
          },
          rating_reference: {
            type: 'object',
            title: 'Rating legend (read-only)',
            readOnly: true,
            default: {
              $data: 'dict.sustainability_rating.byCode',
              $fallback: EMBEDDED_DICTIONARIES.sustainability_rating.reduce((acc, entry) => {
                acc[entry.code] = { ...entry };
                return acc;
              }, {})
            },
            additionalProperties: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' }
              }
            }
          }
        }
      }
    },
    {
      id: 'impact-reporting-template',
      title: 'Impact reporting template',
      summary:
        'Build a quarterly impact report with nested sections for outcomes, beneficiaries, and SDG alignment.',
      schema: {
        title: 'Impact reporting template',
        type: 'object',
        required: ['reporting_quarter', 'outcomes'],
        properties: {
          reporting_quarter: {
            type: 'string',
            title: 'Reporting quarter',
            pattern: '^[0-9]{4}-Q[1-4]$'
          },
          sdg_alignment: {
            type: 'array',
            title: 'SDG alignment',
            items: {
              type: 'string',
              enum: ['SDG 7', 'SDG 9', 'SDG 11', 'SDG 12', 'SDG 13']
            }
          },
          outcomes: {
            type: 'array',
            minItems: 1,
            title: 'Outcomes',
            items: {
              type: 'object',
              required: ['description', 'metric', 'beneficiaries'],
              properties: {
                description: {
                  type: 'string',
                  title: 'Outcome description'
                },
                metric: {
                  type: 'string',
                  title: 'Metric',
                  options: {
                    enumSource: [createEnumSourceConfig('esg_metric')]
                  }
                },
                beneficiaries: {
                  type: 'array',
                  title: 'Beneficiaries',
                  minItems: 1,
                  items: {
                    type: 'object',
                    required: ['group', 'country'],
                    properties: {
                      group: {
                        type: 'string',
                        title: 'Beneficiary group'
                      },
                      country: {
                        type: 'string',
                        title: 'Country',
                        options: {
                          enumSource: [createEnumSourceConfig('country')]
                        }
                      },
                      reach: {
                        type: 'integer',
                        title: 'People reached',
                        minimum: 0
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      id: 'green-finance-dashboard',
      title: 'Green finance dashboard',
      summary:
        'Summarise sustainable finance allocations with aggregate fields and supporting notes.',
      schema: {
        title: 'Green finance dashboard input',
        type: 'object',
        required: ['report_date', 'totals'],
        properties: {
          report_date: {
            type: 'string',
            title: 'Report date',
            format: 'date'
          },
          totals: {
            type: 'object',
            title: 'Aggregate totals',
            required: ['committed', 'disbursed'],
            properties: {
              committed: {
                type: 'number',
                title: 'Committed (millions)',
                minimum: 0
              },
              disbursed: {
                type: 'number',
                title: 'Disbursed (millions)',
                minimum: 0
              },
              currency: {
                type: 'string',
                title: 'Currency',
                options: {
                  enumSource: [createEnumSourceConfig('currency')]
                }
              }
            }
          },
          allocation_breakdown: {
            type: 'array',
            title: 'Allocation breakdown',
            items: {
              type: 'object',
              required: ['asset_class', 'amount'],
              properties: {
                asset_class: {
                  type: 'string',
                  title: 'Asset class',
                  options: {
                    enumSource: [createEnumSourceConfig('asset_class')]
                  }
                },
                amount: {
                  type: 'number',
                  title: 'Amount (millions)',
                  minimum: 0
                }
              }
            }
          },
          narrative: {
            type: 'string',
            title: 'Narrative summary',
            options: {
              inputAttributes: {
                rows: 4
              }
            }
          }
        }
      }
    },
    {
      id: 'stakeholder-engagement-log',
      title: 'Stakeholder engagement log',
      summary:
        'Record stakeholder engagement activities with location, stakeholder type, and follow-up actions.',
      schema: {
        title: 'Stakeholder engagement log',
        type: 'object',
        required: ['engagements'],
        properties: {
          engagements: {
            type: 'array',
            title: 'Engagements',
            minItems: 1,
            items: {
              type: 'object',
              required: ['date', 'stakeholder_type', 'country'],
              properties: {
                date: {
                  type: 'string',
                  title: 'Date',
                  format: 'date'
                },
                stakeholder_type: {
                  type: 'string',
                  title: 'Stakeholder type',
                  enum: ['Investor', 'NGO', 'Community', 'Regulator', 'Employee']
                },
                country: {
                  type: 'string',
                  title: 'Country',
                  options: {
                    enumSource: [createEnumSourceConfig('country')]
                  }
                },
                summary: {
                  type: 'string',
                  title: 'Summary of discussion'
                },
                follow_up_actions: {
                  type: 'string',
                  title: 'Follow-up actions'
                }
              }
            }
          }
        }
      }
    }
  ];

  const exampleMap = new Map(SCHEMA_EXAMPLES.map(example => [example.id, example]));

  function updateExampleDescription(exampleId) {
    if (!exampleDescription) {
      return;
    }
    const selected = exampleMap.get(exampleId);
    if (!selected) {
      exampleDescription.textContent = '';
      return;
    }
    exampleDescription.textContent = selected.summary;
  }

  function loadExampleSchema(exampleId) {
    const targetId = exampleId || (exampleSelect ? exampleSelect.value : undefined);
    const example = exampleMap.get(targetId);
    if (!example) {
      setSchemaError('Unable to find the requested example schema.');
      return;
    }

    schemaInput.value = JSON.stringify(example.schema, null, 2);
    updateExampleDescription(targetId);
    renderEditorFromSchema();
  }

  renderButton.addEventListener('click', renderEditorFromSchema);
  resetFormButton.addEventListener('click', resetForm);
  loadExampleButton.addEventListener('click', () => loadExampleSchema());

  if (exampleSelect) {
    exampleSelect.addEventListener('change', event => {
      updateExampleDescription(event.target.value);
    });
  }

  registerDictionaryTokens();

  if (exampleSelect) {
    SCHEMA_EXAMPLES.forEach(example => {
      const option = document.createElement('option');
      option.value = example.id;
      option.textContent = example.title;
      exampleSelect.appendChild(option);
    });

    if (SCHEMA_EXAMPLES.length > 0) {
      exampleSelect.value = SCHEMA_EXAMPLES[0].id;
      loadExampleSchema(SCHEMA_EXAMPLES[0].id);
    }
  } else if (SCHEMA_EXAMPLES.length > 0) {
    loadExampleSchema(SCHEMA_EXAMPLES[0].id);
  }
});
