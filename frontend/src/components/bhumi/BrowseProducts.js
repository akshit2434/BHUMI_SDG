import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../../styles/components/bhumi/productList.module.scss';
import BhumiService from '../../services/bhumi.service';
import Loader from '../common/Loader';

const BrowseProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await BhumiService.getAllProducts();
                setProducts(data);
            } catch (error) {
                console.error('Error fetching products:', error);
                setError(error);
                toast.error(error.message || 'Failed to fetch products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const handleContactClick = (contact) => {
        window.location.href = `mailto:${contact}`;
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
                <h2>Available Byproducts</h2>
                <p className={styles.subtitle}>Browse and purchase available byproducts</p>
            </div>
            {products.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No products available at the moment</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {products.map(product => (
                        <div key={product._id} className={styles.productCard}>
                            <div className={styles.productHeader}>
                                <h3>{product.title}</h3>
                                <span className={styles.status}>Available</span>
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
                                    className={styles.contactButton}
                                    onClick={() => handleContactClick(product.contact)}
                                >
                                    Contact Seller
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BrowseProducts;