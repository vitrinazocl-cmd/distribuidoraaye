import sys
import pandas as pd
import json

def update_inventory():
    try:
        # El primer argumento es la ruta del excel, el segundo es un JSON string del carrito
        excel_path = 'INVENTARIOREAL2026.xlsx'
        carrito_json = sys.argv[1]
        carrito = json.loads(carrito_json)

        df = pd.read_excel(excel_path)
        
        # Intentar buscar la columna de ID o Nombre
        col_id = None
        for col in df.columns:
            if str(col).upper() in ['ID', 'SKU', 'CODIGO', 'NOMBRE', 'PRODUCTO', 'ARTICULO']:
                col_id = col
                break
        if not col_id: col_id = df.columns[0]

        # Intentar buscar la columna de Stock
        col_stock = None
        for col in df.columns:
            if str(col).upper() in ['STOCK', 'CANTIDAD', 'INVENTARIO', 'DISPONIBLE']:
                col_stock = col
                break
        
        if not col_stock:
            print("No se encontró columna de stock")
            sys.exit(1)

        actualizados = 0
        for item in carrito:
            item_id = str(item.get('id', '')).upper()
            item_name = str(item.get('name', '')).upper()
            qty = float(item.get('quantity', 0))

            for index, row in df.iterrows():
                row_val = str(row[col_id]).upper()
                if row_val == item_id or item_name in row_val or row_val in item_name:
                    current_stock = float(row[col_stock]) if pd.notna(row[col_stock]) else 0.0
                    new_stock = max(0, current_stock - qty)
                    df.at[index, col_stock] = new_stock
                    actualizados += 1
                    break
        
        if actualizados > 0:
            df.to_excel(excel_path, index=False)
            print("OK")
        else:
            print("NO_MATCH")

    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    update_inventory()
