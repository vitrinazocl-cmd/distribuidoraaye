import pandas as pd
import json

df = pd.read_excel('CATALOGO ELEODORO JUNIO 26 ia.xlsx')
# find columns or rows that might have flavors. Let's just print the whole dataframe as a list of dicts.
print(df.to_json(orient="records", force_ascii=False))
