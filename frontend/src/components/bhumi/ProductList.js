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

    useEffect(() => {
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

        fetchProducts();
    }, []);

    const handleEdit = (productId) => {
        // TODO: Implement edit functionality
        toast.info('Edit functionality coming soon');
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
                                <div className={styles.detailItem}>
                                    <span className={styles.label}>Price</span>
                                    <span className={styles.value}>${product.price_per_unit}/{product.unit}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.label}>Available Units</span>
                                    <span className={styles.value}>{product.quantity || 'N/A'}</span>
                                </div>
                            </div>
                            <div className={styles.actions}>
                                <button
                                    className={styles.editButton}
                                    onClick={() => handleEdit(product._id)}
                                >
                                    Edit Listing
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductList;