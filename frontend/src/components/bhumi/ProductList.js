import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../../styles/components/bhumi/productList.module.scss';
import BhumiService from '../../services/bhumi.service';
import Loader from '../common/Loader';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState(null);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await BhumiService.getUserProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error);
            toast.error(error.message || 'Failed to fetch your products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            title: product.title,
            description: product.description,
            price_per_unit: product.price_per_unit,
            unit: product.unit,
            contact: product.contact,
            available_units: product.available_units,
            user_name: product.user_name
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price_per_unit' || name === 'available_units'
                ? parseFloat(value) || value
                : value
        }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await BhumiService.updateProduct(editingProduct._id, formData);
            toast.success('Product updated successfully');
            setEditingProduct(null);
            fetchProducts();
        } catch (error) {
            toast.error(error.message || 'Failed to update product');
        }
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                await BhumiService.deleteProduct(productId);
                toast.success('Product deleted successfully');
                fetchProducts();
            } catch (error) {
                toast.error(error.message || 'Failed to delete product');
            }
        }
    };

    const handleCancel = () => {
        setEditingProduct(null);
        setFormData(null);
    };

    if (loading) {
        return <div className={styles.loaderContainer}><Loader /></div>;
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <h3>Error</h3>
                <p>{error.message}</p>
            </div>
        );
    }

    return (
        <div className={styles.productList}>
            <div className={styles.header}>
                <h2>My Listings</h2>
                <p className={styles.subtitle}>Manage your listed byproducts</p>
            </div>
            {products.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>You haven't listed any products yet</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {products.map(product => (
                        <div key={product._id} className={styles.productCard}>
                            <div className={styles.productHeader}>
                                <h3>{product.title}</h3>
                                <span className={styles.status}>Active</span>
                            </div>
                            <p className={styles.description}>{product.description}</p>
                            <div className={styles.details}>
                                <div className={styles.detailRow}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Price</span>
                                        <span className={styles.value}>₹{product.price_per_unit}/{product.unit}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Available Units</span>
                                        <span className={styles.value}>{product.available_units} {product.unit}</span>
                                    </div>
                                </div>
                                <div className={styles.detailRow}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Listed By</span>
                                        <span className={styles.value}>{product.user_name}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.label}>Contact</span>
                                        <span className={styles.value}>{product.contact}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                <button
                                    className={styles.editButton}
                                    onClick={() => handleEdit(product)}
                                >
                                    Edit Listing
                                </button>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDelete(product._id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editingProduct && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Edit Product</h3>
                        <form onSubmit={handleUpdate}>
                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Price per Unit</label>
                                    <input
                                        type="number"
                                        name="price_per_unit"
                                        value={formData.price_per_unit}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Unit</label>
                                    <input
                                        type="text"
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Available Units</label>
                                    <input
                                        type="number"
                                        name="available_units"
                                        value={formData.available_units}
                                        onChange={handleChange}
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Contact</label>
                                    <input
                                        type="text"
                                        name="contact"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelButton} onClick={handleCancel}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.saveButton}>
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;