from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.product import Product
from db import db
from bson.objectid import ObjectId

product_routes = Blueprint('product_routes', __name__, url_prefix='/api')
products_collection = db['products']

@product_routes.route('/products', methods=['GET'])
@jwt_required()
def get_products():
    product_list = []
    for product_data in products_collection.find():
        product = Product(**product_data)
        product_list.append(product.to_dict())
    return jsonify(product_list)

@product_routes.route('/products/user', methods=['GET'])
@jwt_required()
def get_user_products():
    current_user = get_jwt_identity()
    product_list = []
    for product_data in products_collection.find({'user_id': current_user}):
        product = Product(**product_data)
        product_list.append(product.to_dict())
    return jsonify(product_list)

@product_routes.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    data = request.get_json()
    current_user = get_jwt_identity()
    try:
        product = Product(
            title=data['title'],
            description=data['description'],
            price_per_unit=float(data['price_per_unit']),
            unit=data['unit'],
            contact=data['contact'],
            user_id=current_user
        )
        product_dict = product.to_dict()
        result = products_collection.insert_one(product_dict)
        product._id = result.inserted_id
        created_product = product.to_dict()
        return jsonify(created_product), 201
    except (KeyError, ValueError) as e:
        return jsonify({'error': str(e)}), 400

@product_routes.route('/products/<string:product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    product_data = products_collection.find_one({'_id': ObjectId(product_id)})
    if product_data:
        product = Product(**product_data)
        return jsonify(product.to_dict())
    return jsonify({'message': 'Product not found'}), 404

@product_routes.route('/products/<string:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    current_user = get_jwt_identity()
    data = request.get_json()
    try:
        product = products_collection.find_one({
            '_id': ObjectId(product_id),
            'user_id': current_user
        })
        if not product:
            return jsonify({'message': 'Product not found or unauthorized'}), 404

        updated_data = {k: v for k, v in data.items() if k not in ['_id', 'user_id']}
        products_collection.update_one(
            {'_id': ObjectId(product_id), 'user_id': current_user},
            {'$set': updated_data}
        )
        updated_product_data = products_collection.find_one({'_id': ObjectId(product_id)})
        if updated_product_data:
            updated_product = Product(**updated_product_data)
            return jsonify(updated_product.to_dict())
        return jsonify({'message': 'Product not found'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@product_routes.route('/products/<string:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    current_user = get_jwt_identity()
    result = products_collection.delete_one({
        '_id': ObjectId(product_id),
        'user_id': current_user
    })
    if result.deleted_count > 0:
        return '', 204
    return jsonify({'message': 'Product not found or unauthorized'}), 404