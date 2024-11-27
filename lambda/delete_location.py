# lambda/delete_location.py
from common import table, create_response

def handler(event, context):
    try:
        location_id = event['pathParameters']['id']
        
        # Verificar si la ubicación existe
        response = table.get_item(Key={'id': location_id})
        if 'Item' not in response:
            return create_response(404, {'error': 'Location not found'})
        
        # Eliminar la ubicación
        table.delete_item(Key={'id': location_id})
        
        return create_response(204, None)
    except Exception as e:
        return create_response(500, {'error': str(e)})
