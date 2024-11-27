# lambda/get_locations.py
from common import table, create_response

def handler(event, context):
    try:
        # Obtener todas las ubicaciones
        response = table.scan()
        locations = response['Items']
        
        # Manejar paginación si hay más de 1MB de datos
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            locations.extend(response['Items'])
        
        return create_response(200, locations)
    except Exception as e:
        return create_response(500, {'error': str(e)})