# Demonstrator JSON Editor dla danych ESG

Proof-of-concept aplikacja typu single-page prezentująca generowanie formularzy z JSON Schema po polsku. Projekt zawiera
wbudowane słowniki finansowe (kraje, waluty, metryki ESG i inne), bibliotekę przykładowych schematów oraz mechanizm
wyróżniania tokenów `$data` w edytorze schematu.

## Najważniejsze funkcje

- Dwukolumnowy edytor: po lewej JSON Schema z podświetleniem tokenów słownikowych, po prawej wygenerowany formularz JSON Editor.
- 13 gotowych przykładów z domeny ESG/finansów ilustrujących walidację, zależności warunkowe i użycie słowników.
- Wbudowane słowniki dostępne przez tokeny `$data` z opcjonalnymi listami zapasowymi `$fallback`.
- Dokumentacja użytkownika i wskazówki projektowe przeniesione do osobnej zakładki interfejsu.
- Interfejs w Bootstrap 5, w tym responsywne karty, ciemny tryb (prefers-color-scheme) oraz dedykowana ikonka favicon.

## Uruchomienie lokalne

1. Zainstaluj dowolny serwer plików statycznych (np. Python jest dostępny domyślnie):
   ```bash
   python -m http.server 8000
   ```
2. Otwórz przeglądarkę na `http://localhost:8000/`. Strona samodzielnie załaduje zasoby z katalogu i nie wymaga dodatkowego
   backendu.

## Korzystanie z edytora

1. Wybierz przykład z listy „Biblioteka przykładów” i kliknij **Załaduj**.
2. Zmodyfikuj schemat w edytorze po lewej stronie. Tokeny typu `dict.…` zostaną podświetlone na żółto.
3. Kliknij **Generuj formularz**, aby ponownie zainicjować JSON Editor z Twoim schematem.
4. Wypełnij formularz — aktualny JSON pojawi się w panelu „Aktualne dane”.
5. Skorzystaj z przycisku **Resetuj formularz**, aby wrócić do wartości początkowych.

## Tokeny słownikowe

Każdy słownik dostępny jest pod kluczem `dict.<nazwa>` wraz z wygodnymi pochodnymi:

- `dict.country`, `dict.country.codes`, `dict.country.descriptions`
- `dict.currency`, `dict.currency.codes`, `dict.currency.descriptions`
- `dict.esg_metric`, `dict.asset_class`, `dict.sustainability_rating`

Tokeny można stosować w `enum`, `enum_titles`, a także w sekcjach walidacyjnych (`const`, `contains`, reguły warunkowe). Gdy
formularz powinien działać offline, można dodać krótkie pole `$fallback` zawierające zastępczą listę wartości.

## Licencja

Projekt demonstracyjny, bez określonej licencji. W przypadku wykorzystania w środowisku produkcyjnym pamiętaj o sprawdzeniu
licencji zależności (JSON Editor, Bootstrap).
