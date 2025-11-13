const EMBEDDED_DICTIONARIES = {
  country: [
    { id: 'country_pl', code: 'PL', description: 'Polska' },
    { id: 'country_de', code: 'DE', description: 'Niemcy' },
    { id: 'country_se', code: 'SE', description: 'Szwecja' },
    { id: 'country_us', code: 'US', description: 'Stany Zjednoczone' },
    { id: 'country_br', code: 'BR', description: 'Brazylia' },
    { id: 'country_za', code: 'ZA', description: 'Republika Południowej Afryki' },
    { id: 'country_jp', code: 'JP', description: 'Japonia' }
  ],
  currency: [
    { id: 'currency_eur', code: 'EUR', description: 'Euro' },
    { id: 'currency_pln', code: 'PLN', description: 'Polski złoty' },
    { id: 'currency_usd', code: 'USD', description: 'Dolar amerykański' },
    { id: 'currency_gbp', code: 'GBP', description: 'Funt szterling' },
    { id: 'currency_jpy', code: 'JPY', description: 'Jen japoński' },
    { id: 'currency_brl', code: 'BRL', description: 'Real brazylijski' },
    { id: 'currency_zar', code: 'ZAR', description: 'Rand południowoafrykański' }
  ],
  esg_metric: [
    { id: 'metric_co2_intensity', code: 'CARBON_INTENSITY', description: 'Intensywność emisji CO₂ (tCO₂e / mln EUR przychodu)' },
    { id: 'metric_scope3', code: 'SCOPE3_SHARE', description: 'Udział emisji zakresu 3 w emisjach ogółem (%)' },
    { id: 'metric_water', code: 'WATER_WITHDRAWAL', description: 'Pobór wody słodkiej (m³)' },
    { id: 'metric_waste', code: 'WASTE_RECYCLED', description: 'Odsetek odpadów poddanych recyklingowi (%)' },
    { id: 'metric_diversity', code: 'DIVERSITY_RATIO', description: 'Udział kobiet w kierownictwie (%)' },
    { id: 'metric_training', code: 'TRAINING_HOURS', description: 'Średnia liczba godzin szkoleniowych na pracownika' }
  ],
  asset_class: [
    { id: 'asset_equity', code: 'EQUITY', description: 'Akcje notowane' },
    { id: 'asset_fixed_income', code: 'FIXED_INCOME', description: 'Instrumenty dłużne' },
    { id: 'asset_real_assets', code: 'REAL_ASSETS', description: 'Aktywa rzeczowe i infrastruktura' },
    { id: 'asset_private_equity', code: 'PRIVATE_EQUITY', description: 'Private equity i venture capital' },
    { id: 'asset_cash', code: 'CASH', description: 'Gotówka i ekwiwalenty' }
  ],
  sustainability_rating: [
    { id: 'rating_low', code: 'LOW', description: 'Niskie ryzyko ESG' },
    { id: 'rating_medium', code: 'MEDIUM', description: 'Średnie ryzyko ESG' },
    { id: 'rating_high', code: 'HIGH', description: 'Wysokie ryzyko ESG' },
    { id: 'rating_severe', code: 'SEVERE', description: 'Krytyczne ryzyko ESG' }
  ]
};

function dictionaryCodes(dictionaryName) {
  return EMBEDDED_DICTIONARIES[dictionaryName].map(entry => entry.code);
}

function dictionaryDescriptions(dictionaryName) {
  return EMBEDDED_DICTIONARIES[dictionaryName].map(entry => `${entry.code} — ${entry.description}`);
}

function dictionaryEntries(dictionaryName) {
  return EMBEDDED_DICTIONARIES[dictionaryName].map(entry => ({ ...entry }));
}

const SCHEMA_EXAMPLES = [
  {
    id: 'raport-kpi-esg',
    title: 'Raport KPI ESG',
    summary: 'Comiesięczne raportowanie kluczowych metryk ESG z walutą raportową i komentarzami.',
    schema: {
      title: 'Zgłoszenie KPI ESG',
      description: 'Formularz do zbierania wskaźników ESG wraz z jednostkami, komentarzem i statusem weryfikacji.',
      type: 'object',
      required: ['okres_raportowania', 'waluta_raportu', 'pozycje'],
      properties: {
        okres_raportowania: {
          type: 'string',
          title: 'Okres raportowania',
          format: 'date'
        },
        waluta_raportu: {
          type: 'string',
          title: 'Waluta raportu',
          enum: { $data: 'dict.currency.codes', $fallback: dictionaryCodes('currency') },
          options: {
            enum_titles: { $data: 'dict.currency.descriptions', $fallback: dictionaryDescriptions('currency') }
          },
          default: 'EUR'
        },
        weryfikacja_zewnetrzna: {
          type: 'boolean',
          title: 'Czy dane zostały zweryfikowane niezależnie?',
          format: 'checkbox',
          default: false
        },
        pozycje: {
          type: 'array',
          title: 'Pozycje KPI',
          minItems: 1,
          format: 'table',
          items: {
            type: 'object',
            required: ['metryka', 'wartosc'],
            properties: {
              metryka: {
                type: 'string',
                title: 'Metryka',
                enum: { $data: 'dict.esg_metric.codes' },
                options: {
                  enum_titles: { $data: 'dict.esg_metric.descriptions' }
                }
              },
              wartosc: {
                type: 'number',
                title: 'Wartość',
                minimum: 0
              },
              jednostka: {
                type: 'string',
                title: 'Jednostka',
                default: 'automatycznie'
              },
              komentarz: {
                type: 'string',
                title: 'Komentarz',
                options: {
                  inputAttributes: {
                    placeholder: 'Opis zmian, źródło danych, działania korygujące'
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
    id: 'zielona-obligacja',
    title: 'Karta zielonej obligacji',
    summary: 'Opis emisji obligacji z oznaczeniem kraju, waluty i kategorii wykorzystania środków.',
    schema: {
      title: 'Profil zielonej obligacji',
      type: 'object',
      required: ['emitent', 'kraj_emisji', 'waluta', 'wartosc_emisji'],
      properties: {
        emitent: {
          type: 'string',
          title: 'Nazwa emitenta',
          minLength: 2
        },
        kraj_emisji: {
          type: 'string',
          title: 'Kraj emisji',
          enum: { $data: 'dict.country.codes' },
          options: {
            enum_titles: { $data: 'dict.country.descriptions' }
          }
        },
        waluta: {
          type: 'string',
          title: 'Waluta emisji',
          enum: { $data: 'dict.currency.codes' }
        },
        wartosc_emisji: {
          type: 'number',
          title: 'Wielkość emisji (mln)',
          minimum: 1
        },
        termin_wykupu: {
          type: 'string',
          title: 'Termin wykupu',
          format: 'date'
        },
        wykorzystanie_srodkow: {
          type: 'array',
          title: 'Kategorie wykorzystania środków',
          items: {
            type: 'string',
            title: 'Kategoria',
            enum: { $data: 'dict.asset_class.codes' },
            options: {
              enum_titles: { $data: 'dict.asset_class.descriptions' }
            }
          },
          uniqueItems: true
        },
        niezalezna_opinia: {
          type: 'string',
          title: 'Dostawca opinii zewnętrznej',
          default: 'brak'
        }
      }
    }
  },
  {
    id: 'alokacja-portfela',
    title: 'Alokacja portfela z kryteriami ESG',
    summary: 'Zdefiniuj strukturę portfela i wymagane oceny ESG dla poszczególnych klas aktywów.',
    schema: {
      title: 'Alokacja portfela ESG',
      type: 'object',
      required: ['alokacje'],
      properties: {
        alokacje: {
          type: 'array',
          title: 'Alokacje',
          minItems: 1,
          items: {
            type: 'object',
            required: ['klasa_aktywow', 'docelowy_udzial', 'ocena'],
            properties: {
              klasa_aktywow: {
                type: 'string',
                title: 'Klasa aktywów',
                enum: { $data: 'dict.asset_class.codes' },
                options: {
                  enum_titles: { $data: 'dict.asset_class.descriptions' }
                }
              },
              docelowy_udzial: {
                type: 'number',
                title: 'Docelowy udział (%)',
                minimum: 0,
                maximum: 100
              },
              ocena: {
                type: 'string',
                title: 'Ocena zrównoważenia',
                enum: { $data: 'dict.sustainability_rating.codes', $fallback: dictionaryCodes('sustainability_rating') },
                options: {
                  enum_titles: { $data: 'dict.sustainability_rating.descriptions', $fallback: dictionaryDescriptions('sustainability_rating') }
                }
              },
              wymagany_plan: {
                type: 'boolean',
                title: 'Wymagany plan naprawczy',
                format: 'checkbox',
                default: false
              },
              komentarz: {
                type: 'string',
                title: 'Komentarz'
              }
            },
            allOf: [
              {
                if: {
                  properties: {
                    ocena: {
                      enum: ['HIGH', 'SEVERE']
                    }
                  },
                  required: ['ocena']
                },
                then: {
                  properties: {
                    wymagany_plan: {
                      const: true,
                      title: 'Plan naprawczy wymagany ze względu na wysokie ryzyko'
                    }
                  },
                  required: ['wymagany_plan']
                }
              }
            ]
          }
        },
        uwagi: {
          type: 'string',
          title: 'Uwagi dotyczące metodologii'
        }
      }
    }
  },
  {
    id: 'ocena-dostawcy',
    title: 'Ocena dostawcy',
    summary: 'Szablon oceny dostawcy z przypisaniem kraju, ryzyka ESG i planu działań.',
    schema: {
      title: 'Karta oceny dostawcy',
      type: 'object',
      required: ['nazwa', 'kraj', 'ocena_ryzyka'],
      properties: {
        nazwa: {
          type: 'string',
          title: 'Nazwa dostawcy',
          minLength: 2
        },
        kraj: {
          type: 'string',
          title: 'Kraj działalności',
          enum: { $data: 'dict.country.codes' },
          options: {
            enum_titles: { $data: 'dict.country.descriptions' }
          }
        },
        ocena_ryzyka: {
          type: 'string',
          title: 'Ocena ryzyka ESG',
          enum: { $data: 'dict.sustainability_rating.codes' }
        },
        opis_ryzyka: {
          type: 'string',
          title: 'Opis głównych ryzyk'
        },
        plan_dzialan: {
          type: 'string',
          title: 'Plan działań',
          minLength: 10
        },
        termin_ponownej_oceny: {
          type: 'string',
          title: 'Termin ponownej oceny',
          format: 'date'
        }
      },
      allOf: [
        {
          if: {
            properties: {
              ocena_ryzyka: {
                enum: ['HIGH', 'SEVERE']
              }
            },
            required: ['ocena_ryzyka']
          },
          then: {
            required: ['plan_dzialan']
          }
        }
      ]
    }
  },
  {
    id: 'rejestr-projektow-klimatycznych',
    title: 'Rejestr projektów klimatycznych',
    summary: 'Monitorowanie projektów z określeniem lokalizacji, klasy aktywów i wskaźników wpływu.',
    schema: {
      title: 'Rejestr projektów klimatycznych',
      type: 'object',
      required: ['projekty'],
      properties: {
        projekty: {
          type: 'array',
          title: 'Projekty',
          minItems: 1,
          items: {
            type: 'object',
            required: ['nazwa', 'kraj', 'klasa_aktywow'],
            properties: {
              nazwa: {
                type: 'string',
                title: 'Nazwa projektu'
              },
              kraj: {
                type: 'string',
                title: 'Lokalizacja',
                enum: { $data: 'dict.country.codes' },
                options: {
                  enum_titles: { $data: 'dict.country.descriptions' }
                }
              },
              klasa_aktywow: {
                type: 'string',
                title: 'Klasa aktywów',
                enum: { $data: 'dict.asset_class.codes' }
              },
              koszt: {
                type: 'number',
                title: 'Koszt projektu (mln)',
                minimum: 0
              },
              metryka_wplywu: {
                type: 'string',
                title: 'Metryka wpływu',
                enum: { $data: 'dict.esg_metric.codes' },
                options: {
                  enum_titles: { $data: 'dict.esg_metric.descriptions' }
                }
              },
              wartosc_docelowa: {
                type: 'number',
                title: 'Wartość docelowa',
                minimum: 0
              }
            }
          }
        }
      }
    }
  },
  {
    id: 'deklaracja-emisji-ghg',
    title: 'Deklaracja emisji GHG',
    summary: 'Rejestracja emisji gazów cieplarnianych z rozbiciem na zakresy i jednostki.',
    schema: {
      title: 'Deklaracja emisji gazów cieplarnianych',
      type: 'object',
      required: ['rok_raportowy', 'waluta'],
      properties: {
        rok_raportowy: {
          type: 'integer',
          title: 'Rok raportowy',
          minimum: 2000,
          maximum: 2100
        },
        waluta: {
          type: 'string',
          title: 'Waluta przeliczeniowa',
          enum: { $data: 'dict.currency.codes' },
          default: 'PLN'
        },
        emisje: {
          type: 'array',
          title: 'Wpisy emisji',
          items: {
            type: 'object',
            required: ['zakres', 'wartosc'],
            properties: {
              zakres: {
                type: 'string',
                title: 'Zakres emisji',
                enum: ['Zakres 1', 'Zakres 2', 'Zakres 3']
              },
              metryka_powiazana: {
                type: 'string',
                title: 'Powiązana metryka słownikowa',
                enum: { $data: 'dict.esg_metric.codes' }
              },
              wartosc: {
                type: 'number',
                title: 'Wartość emisji (tCO₂e)',
                minimum: 0
              },
              jednostka: {
                type: 'string',
                title: 'Jednostka',
                default: 'tCO₂e'
              }
            }
          }
        }
      }
    }
  },
  {
    id: 'finansowanie-zielone',
    title: 'Wniosek o finansowanie zielone',
    summary: 'Formularz kredytowy z walidacją waluty, kategorii projektu i oczekiwanego wpływu.',
    schema: {
      title: 'Wniosek o finansowanie zielone',
      type: 'object',
      required: ['wnioskodawca', 'kraj_realizacji', 'kwota', 'waluta', 'kategoria'],
      properties: {
        wnioskodawca: {
          type: 'string',
          title: 'Wnioskodawca'
        },
        kraj_realizacji: {
          type: 'string',
          title: 'Kraj realizacji',
          enum: { $data: 'dict.country.codes' }
        },
        kwota: {
          type: 'number',
          title: 'Kwota wniosku',
          minimum: 0
        },
        waluta: {
          type: 'string',
          title: 'Waluta',
          enum: { $data: 'dict.currency.codes', $fallback: ['EUR', 'USD', 'PLN'] }
        },
        kategoria: {
          type: 'string',
          title: 'Kategoria projektu',
          enum: { $data: 'dict.asset_class.codes' }
        },
        oczekiwany_wplyw: {
          type: 'string',
          title: 'Oczekiwany wpływ',
          enum: { $data: 'dict.esg_metric.codes' }
        },
        okres_splaty: {
          type: 'integer',
          title: 'Okres spłaty (lata)',
          minimum: 1,
          maximum: 30
        }
      }
    }
  },
  {
    id: 'raport-wplywu-spolecznego',
    title: 'Raport wpływu społecznego',
    summary: 'Zbieranie rezultatów społecznych z wyborem metryk ESG i walidacją wartości.',
    schema: {
      title: 'Raport wpływu społecznego',
      type: 'object',
      required: ['program', 'kraje_objete', 'wyniki'],
      properties: {
        program: {
          type: 'string',
          title: 'Nazwa programu'
        },
        kraje_objete: {
          type: 'array',
          title: 'Kraje objęte programem',
          uniqueItems: true,
          items: {
            type: 'string',
            enum: { $data: 'dict.country.codes' }
          },
          minItems: 1
        },
        wyniki: {
          type: 'array',
          title: 'Wyniki',
          minItems: 1,
          items: {
            type: 'object',
            required: ['metryka', 'wartosc'],
            properties: {
              metryka: {
                type: 'string',
                title: 'Metryka',
                enum: { $data: 'dict.esg_metric.codes' }
              },
              wartosc: {
                type: 'number',
                title: 'Wartość',
                minimum: 0
              },
              jednostka: {
                type: 'string',
                title: 'Jednostka'
              },
              opis: {
                type: 'string',
                title: 'Opis rezultatu'
              }
            }
          }
        },
        waluta_raportu: {
          type: 'string',
          title: 'Waluta raportu',
          enum: { $data: 'dict.currency.codes' },
          default: 'USD'
        }
      }
    }
  },
  {
    id: 'polityka-roznorodnosci',
    title: 'Polityka różnorodności',
    summary: 'Monitorowanie celów różnorodnościowych i krajów objętych polityką.',
    schema: {
      title: 'Raport różnorodności i inkluzywności',
      type: 'object',
      required: ['zakres_polityki', 'cele'],
      properties: {
        zakres_polityki: {
          type: 'array',
          title: 'Zakres geograficzny',
          uniqueItems: true,
          items: {
            type: 'string',
            enum: { $data: 'dict.country.codes' }
          }
        },
        cele: {
          type: 'array',
          title: 'Cele ilościowe',
          items: {
            type: 'object',
            required: ['metryka', 'wartosc_docelowa'],
            properties: {
              metryka: {
                type: 'string',
                title: 'Metryka',
                enum: { $data: 'dict.esg_metric.codes' },
                options: {
                  enum_titles: { $data: 'dict.esg_metric.descriptions' }
                }
              },
              wartosc_docelowa: {
                type: 'number',
                title: 'Wartość docelowa (%)',
                minimum: 0,
                maximum: 100
              },
              rok_docelowy: {
                type: 'integer',
                title: 'Rok docelowy',
                minimum: 2023,
                maximum: 2035
              }
            }
          }
        },
        komentarz: {
          type: 'string',
          title: 'Komentarz jakościowy'
        }
      }
    }
  },
  {
    id: 'ocena-produktu-inwestycyjnego',
    title: 'Ocena produktu inwestycyjnego',
    summary: 'Szablon klasyfikacji produktu finansowego z oceną ryzyka ESG i walutą wyceny.',
    schema: {
      title: 'Ocena produktu inwestycyjnego',
      type: 'object',
      required: ['nazwa', 'klasa_aktywow', 'ocena_ryzyka', 'waluta'],
      properties: {
        nazwa: {
          type: 'string',
          title: 'Nazwa produktu'
        },
        klasa_aktywow: {
          type: 'string',
          title: 'Klasa aktywów',
          enum: { $data: 'dict.asset_class.codes' },
          options: {
            enum_titles: { $data: 'dict.asset_class.descriptions' }
          }
        },
        ocena_ryzyka: {
          type: 'string',
          title: 'Ocena ryzyka ESG',
          enum: { $data: 'dict.sustainability_rating.codes' }
        },
        waluta: {
          type: 'string',
          title: 'Waluta wyceny',
          enum: { $data: 'dict.currency.codes' }
        },
        minimalna_ocena: {
          type: 'string',
          title: 'Minimalna akceptowana ocena ESG',
          enum: { $data: 'dict.sustainability_rating.codes' }
        },
        opis: {
          type: 'string',
          title: 'Opis produktu'
        }
      }
    }
  },
  {
    id: 'mapa-ryzyk-esg',
    title: 'Mapa ryzyk ESG',
    summary: 'Matryca ryzyk według kraju i oceny, wymuszająca działania naprawcze dla wysokich ocen.',
    schema: {
      title: 'Mapa ryzyk ESG',
      type: 'object',
      required: ['ryzyka'],
      properties: {
        ryzyka: {
          type: 'array',
          title: 'Ryzyka',
          minItems: 1,
          items: {
            type: 'object',
            required: ['kraj', 'ocena', 'opis'],
            properties: {
              kraj: {
                type: 'string',
                title: 'Kraj',
                enum: { $data: 'dict.country.codes' }
              },
              obszar: {
                type: 'string',
                title: 'Obszar tematyczny',
                enum: { $data: 'dict.esg_metric.codes' }
              },
              ocena: {
                type: 'string',
                title: 'Ocena ryzyka',
                enum: { $data: 'dict.sustainability_rating.codes' }
              },
              opis: {
                type: 'string',
                title: 'Opis ryzyka',
                minLength: 10
              },
              dzialania: {
                type: 'string',
                title: 'Plan działań'
              }
            },
            allOf: [
              {
                if: {
                  properties: {
                    ocena: {
                      enum: ['HIGH', 'SEVERE']
                    }
                  },
                  required: ['ocena']
                },
                then: {
                  required: ['dzialania']
                }
              }
            ]
          }
        }
      }
    }
  },
  {
    id: 'monitoring-wody',
    title: 'Monitoring zużycia wody',
    summary: 'Śledzenie zużycia wody i recyklingu w wielu lokalizacjach z walutą przeliczeniową.',
    schema: {
      title: 'Monitoring zużycia wody',
      type: 'object',
      required: ['lokalizacje', 'waluta'],
      properties: {
        waluta: {
          type: 'string',
          title: 'Waluta kosztów',
          enum: { $data: 'dict.currency.codes' }
        },
        lokalizacje: {
          type: 'array',
          title: 'Lokalizacje',
          minItems: 1,
          items: {
            type: 'object',
            required: ['kraj', 'pobor_wody'],
            properties: {
              kraj: {
                type: 'string',
                title: 'Kraj',
                enum: { $data: 'dict.country.codes' }
              },
              pobor_wody: {
                type: 'number',
                title: 'Pobór wody (m³)',
                minimum: 0
              },
              recykling: {
                type: 'number',
                title: 'Recykling odpadów wodnych (%)',
                minimum: 0,
                maximum: 100
              },
              priorytet_metryki: {
                type: 'string',
                title: 'Kluczowa metryka',
                enum: { $data: 'dict.esg_metric.codes' }
              }
            }
          }
        }
      }
    }
  },
  {
    id: 'plan-adaptacji',
    title: 'Plan adaptacji klimatycznej',
    summary: 'Rejestr działań adaptacyjnych z klasami aktywów i powiązanymi metrykami.',
    schema: {
      title: 'Plan adaptacji klimatycznej',
      type: 'object',
      required: ['dzialania'],
      properties: {
        dzialania: {
          type: 'array',
          title: 'Działania',
          minItems: 1,
          items: {
            type: 'object',
            required: ['nazwa', 'klasa_aktywow', 'metryka_postepu'],
            properties: {
              nazwa: {
                type: 'string',
                title: 'Nazwa działania'
              },
              klasa_aktywow: {
                type: 'string',
                title: 'Powiązana klasa aktywów',
                enum: { $data: 'dict.asset_class.codes' }
              },
              metryka_postepu: {
                type: 'string',
                title: 'Metryka postępu',
                enum: { $data: 'dict.esg_metric.codes' }
              },
              termin: {
                type: 'string',
                title: 'Termin',
                format: 'date'
              },
              status: {
                type: 'string',
                title: 'Status',
                enum: ['Planowane', 'W toku', 'Zakończone'],
                default: 'Planowane'
              }
            }
          }
        },
        ocena_ryzyka: {
          type: 'string',
          title: 'Aktualna ocena ryzyka ESG',
          enum: { $data: 'dict.sustainability_rating.codes' },
          default: 'MEDIUM'
        }
      }
    }
  }
];

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
    schemaError.textContent = 'Nie udało się wczytać biblioteki JSON Editor. Odśwież stronę.';
    schemaError.classList.remove('d-none');
    renderButton.disabled = true;
    loadExampleButton.disabled = true;
    resetFormButton.disabled = true;
    if (exampleSelect) {
      exampleSelect.disabled = true;
    }
    return;
  }

  JSONEditor.defaults.options.theme = 'bootstrap5';
  JSONEditor.defaults.options.iconlib = 'bootstrap5';
  JSONEditor.defaults.options.ajax = true;
  JSONEditor.defaults.options.disable_edit_json = true;
  JSONEditor.defaults.options.disable_properties = true;
  JSONEditor.defaults.options.show_errors = 'interaction';
  JSONEditor.defaults.options.object_layout = 'normal';
  JSONEditor.defaults.options.use_default_values = true;

  const dataTokens = {};
  registerDictionaryTokens();

  let editor = null;
  let editorInitialValue = {};
  let editorReady = false;

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
      const entries = dictionaryEntries(name);
      const codes = dictionaryCodes(name);
      const descriptions = dictionaryDescriptions(name);
      const lookupByCode = entries.reduce((acc, entry) => {
        acc[entry.code] = { ...entry };
        return acc;
      }, {});

      dataTokens[`dict.${name}`] = cloneValue(entries);
      dataTokens[`dict.${name}.codes`] = cloneValue(codes);
      dataTokens[`dict.${name}.descriptions`] = cloneValue(descriptions);
      dataTokens[`dict.${name}.byCode`] = cloneValue(lookupByCode);
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
          missingTokens.add('(niepoprawny token $data)');
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
    if (!schemaError) {
      return;
    }

    if (!message) {
      schemaError.textContent = '';
      schemaError.classList.add('d-none');
      return;
    }

    schemaError.textContent = message;
    schemaError.classList.remove('d-none');
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
      setSchemaError('Podaj schemat JSON, aby wygenerować formularz.');
      destroyEditor();
      return;
    }

    let schema;
    try {
      schema = JSON.parse(rawSchema);
    } catch (error) {
      setSchemaError(`Schemat nie jest poprawnym JSON-em: ${error.message}`);
      destroyEditor();
      return;
    }

    const missingTokens = new Set();
    const schemaWithData = resolveDataTokens(schema, missingTokens);

    if (missingTokens.size > 0) {
      setSchemaError(`Schemat odwołuje się do nieznanych tokenów: ${Array.from(missingTokens).sort().join(', ')}`);
      destroyEditor();
      return;
    }

    setSchemaError('');
    destroyEditor();

    try {
      editor = new JSONEditor(editorHolder, {
        schema: schemaWithData,
        ajax: true,
        disable_edit_json: true,
        disable_properties: true,
        show_errors: 'interaction'
      });
    } catch (error) {
      console.error('Failed to render schema', error);
      setSchemaError(`Nie udało się wyrenderować schematu: ${error.message}`);
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

  function findExampleById(exampleId) {
    return SCHEMA_EXAMPLES.find(example => example.id === exampleId) || null;
  }

  function loadExamplesIntoSelect() {
    if (!exampleSelect) {
      return;
    }

    exampleSelect.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Wybierz przykład…';
    placeholder.disabled = true;
    placeholder.selected = true;
    exampleSelect.appendChild(placeholder);

    SCHEMA_EXAMPLES.forEach(example => {
      const option = document.createElement('option');
      option.value = example.id;
      option.textContent = example.title;
      exampleSelect.appendChild(option);
    });
  }

  function displayExampleSummary(example) {
    if (!exampleDescription) {
      return;
    }

    if (!example) {
      exampleDescription.textContent = '';
      return;
    }

    exampleDescription.textContent = example.summary;
  }

  function loadExampleIntoEditor(example) {
    if (!example) {
      return;
    }

    const formattedSchema = JSON.stringify(example.schema, null, 2);
    schemaInput.value = formattedSchema;
    if (exampleSelect) {
      exampleSelect.value = example.id;
      const placeholder = exampleSelect.querySelector('option[value=""]');
      if (placeholder) {
        placeholder.selected = false;
      }
    }
    displayExampleSummary(example);
  }

  renderButton.addEventListener('click', () => {
    renderEditorFromSchema();
  });

  loadExampleButton.addEventListener('click', () => {
    const selectedId = exampleSelect.value;
    const example = findExampleById(selectedId);

    if (!example) {
      setSchemaError('Wybierz przykład z listy, aby go wczytać.');
      return;
    }

    loadExampleIntoEditor(example);
    setSchemaError('');
    renderEditorFromSchema();
  });

  exampleSelect.addEventListener('change', () => {
    const example = findExampleById(exampleSelect.value);
    displayExampleSummary(example);
    setSchemaError('');
  });

  resetFormButton.addEventListener('click', () => {
    resetForm();
  });

  loadExamplesIntoSelect();
  const initialExample = SCHEMA_EXAMPLES[0];
  loadExampleIntoEditor(initialExample);
  renderEditorFromSchema();
});
