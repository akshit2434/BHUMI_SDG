import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../../styles/components/bhumi/addProduct.module.scss';
import BhumiService from '../../services/bhumi.service';
import Loader from '../common/Loader';

const AddProduct = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price_per_unit, setPricePerUnit] = useState('');
    const [unit, setUnit] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [availableUnits, setAvailableUnits] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const data = await BhumiService.getUserDetails();
                setOrganizationName(data.organization);
                setContactInfo(data.email);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user details:', error);
                toast.error('Failed to fetch user details');
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await BhumiService.addProduct({
                title,
                description,
                price_per_unit: parseFloat(price_per_unit),
                unit,
                contact: contactInfo,
                available_units: parseFloat(availableUnits),
                user_name: organizationName,
            });

            toast.success('Product listed successfully!');
            // Reset form after successful submission
            setTitle('');
            setDescription('');
            setPricePerUnit('');
            setUnit('');
            setAvailableUnits('');
        } catch (error) {
            console.error('Error adding product:', error);
            toast.error(error.message || 'Failed to list product');
        }
    };

    if (loading) {
        return <div className={styles.loaderContainer}><Loader /></div>;
    }

    return (
        <div className={styles.addProduct}>
            <h2>List a Byproduct</h2>
            <p className={styles.subtitle}>Listing as: {organizationName}</p>
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
                <div className={styles.formRow}>
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
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="available_units">Available Units</label>
                    <input
                        type="number"
                        id="available_units"
                        value={availableUnits}
                        onChange={(e) => setAvailableUnits(e.target.value)}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="contactInfo">Contact Email</label>
                    <input
                        type="email"
                        id="contactInfo"
                        value={contactInfo}
                        readOnly
                        className={styles.readOnlyInput}
                    />
                </div>
                <button type="submit" className={styles.submitButton}>List Product</button>
            </form>
        </div>
    );
};

export default AddProduct;