# lambda/create_location.py
import json
from common import table, create_response
import uuid
from datetime import datetime
from decimal import Decimal

def handler(event, context):
    try:
        body = json.loads(event['body'])
        
        # Validar campos requeridos
        required_fields = ['name', 'latitude', 'longitude']
        if not all(field in body for field in required_fields):
            return create_response(400, {'error': 'Missing required fields'})
        
        # Crear item con coordenadas en Decimal
        current_time = datetime.utcnow().isoformat()
        item = {
            'id': str(uuid.uuid4()),
            'name': body['name'],
            'latitude': Decimal(str(body['latitude'])),
            'longitude': Decimal(str(body['longitude'])),
            'createdAt': current_time,
            'updatedAt': current_time
        }
        
        # Agregar campos opcionales si existen
        if 'description' in body:
            item['description'] = body['description']
        if 'address' in body:
            item['address'] = body['address']
        
        table.put_item(Item=item)
        
        return create_response(201, item)
    except Exception as e:
        return create_response(500, {'error': str(e)})