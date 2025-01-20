import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../../styles/components/bhumi/addProduct.module.scss';
import BhumiService from '../../services/bhumi.service';

const AddProduct = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price_per_unit, setPricePerUnit] = useState('');
    const [unit, setUnit] = useState('');
    const [contactInfo, setContactInfo] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await BhumiService.addProduct({
                title,
                description,
                price_per_unit: parseFloat(price_per_unit),
                unit,
                contact: contactInfo,
            });

            toast.success('Product listed successfully!');
            // Reset form after successful submission
            setTitle('');
            setDescription('');
            setPricePerUnit('');
            setUnit('');
            setContactInfo('');
        } catch (error) {
            console.error('Error adding product:', error);
            toast.error(error.message || 'Failed to list product');
        }
    };

    return (
        <div className={styles.addProduct}>
            <h2>List a Byproduct</h2>
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="price_per_unit">Price Per Unit</label>
                    <input
                        type="number"
                        id="price_per_unit"
                        value={price_per_unit}
                        onChange={(e) => setPricePerUnit(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="unit">Unit</label>
                    <input
                        type="text"
                        id="unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="contactInfo">Contact Information</label>
                    <input
                        type="text"
                        id="contactInfo"
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className={styles.submitButton}>Add Product</button>
            </form>
        </div>
    );
};

export default AddProduct;