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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);

    const fetchProducts = async (search = '') => {
        setLoading(true);
        try {
            const data = await BhumiService.getAllProducts(search);
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            setError(error);
            toast.error(error.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSearch = () => {
        fetchProducts(searchQuery);
    };

    const handleContactClick = (product) => {
        setSelectedProduct(product);
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
    };

    const handleSendEmail = (contact) => {
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
                <div>
                    <h2>Available Byproducts</h2>
                    <p className={styles.subtitle}>Browse and purchase available byproducts</p>
                </div>
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className={styles.searchButton}
                    >
                        Search
                    </button>
                </div>
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
                            </div>
                            <div className={styles.actions}>
                                <button
                                    className={styles.contactButton}
                                    onClick={() => handleContactClick(product)}
                                >
                                    Contact Seller
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedProduct && (
                <div className={styles.modalOverlay} onClick={handleCloseModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3>Contact Seller</h3>
                        <div className={styles.contactDetails}>
                            <div className={styles.detailRow}>
                                <div className={styles.detailItem}>
                                    <span className={styles.label}>Listed By</span>
                                    <span className={styles.value}>{selectedProduct.user_name}</span>
                                </div>
                            </div>
                            <div className={styles.detailRow}>
                                <div className={styles.detailItem}>
                                    <span className={styles.label}>Contact</span>
                                    <span className={styles.value}>{selectedProduct.contact}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalActions}>
                            {/* <button
                                className={styles.contactButton}
                                onClick={() => handleSendEmail(selectedProduct.contact)}
                            >
                                Send Email
                            </button> */}
                            <button
                                className={styles.cancelButton}
                                onClick={handleCloseModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrowseProducts;