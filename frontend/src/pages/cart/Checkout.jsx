import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createOrder } from '../../store/slices/orderSlice.js';
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../services/api.js';
import axios from 'axios';

const CheckoutForm = ({ formData, setFormData, handleSubmit, items, total }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleStripePayment = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Step 1: Call the backend to create a Payment Intent
            const response = await axios.post('http://127.0.0.1:8000/api/orders/create-payment-intent/', {
                amount: Math.round(total * 100), // Convert total to cents
            });

            const { clientSecret } = response.data;

            // Step 2: Confirm the payment using Stripe.js
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                },
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            } else if (paymentIntent.status === 'succeeded') {
                // Payment succeeded, proceed with order creation
                handleSubmit(e);
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={formData.payment_method === 'credit_card' ? handleStripePayment : handleSubmit}>
            {formData.payment_method === 'credit_card' && (
                <>
                    <div className="form-group">
                        <label htmlFor="card-element" className="form-label">Credit Card Details</label>
                        <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--bg-color-secondary)' }}>
                            <CardElement id="card-element" options={{ style: { base: { fontSize: '16px', color: 'var(--text-color)' } } }} />
                        </div>
                    </div>
                    {error && <div className="alert alert-danger">{error}</div>}
                </>
            )}

            <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.5rem' }}
                disabled={loading}
            >
                {loading ? 'Processing...' : 'Place Order'}
            </button>
        </form>
    );
};

const Checkout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { items, restaurantId, restaurantName, total } = useSelector((state) => state.cart);
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { loading, error } = useSelector((state) => state.orders);

    const [formData, setFormData] = useState({
        delivery_address: '',
        delivery_notes: '',
        payment_method: 'cash',
        total_price: total,
    });

    const { delivery_address, delivery_notes, payment_method } = formData;

    useEffect(() => {
        // Redirect if not authenticated or cart is empty
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (items.length === 0) {
            navigate('/cart');
            return;
        }

        // Pre-fill address if user has one
        if (user && user.address) {
            setFormData((prev) => ({
                ...prev,
                delivery_address: user.address,
            }));
        }

        // Update total price if cart changes
        setFormData((prev) => ({
            ...prev,
            total_price: total,
        }));
    }, [isAuthenticated, items, navigate, total, user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const orderData = {
            ...formData,
            restaurant: restaurantId,
        };

        const paymentData = {
            payment_method,
            amount: total,
        };

        dispatch(
            createOrder({
                orderData,
                cartItems: items,
                restaurantId,
                paymentData,
            })
        ).then((resultAction) => {
            if (createOrder.fulfilled.match(resultAction)) {
                const order = resultAction.payload;
                navigate(`/orders/${order.id}`);
            }
        });
    };

    return (
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
            <h1 style={{ marginBottom: '0.5rem', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>Checkout</h1>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-color-secondary)' }}>Complete your order from {restaurantName}</p>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', 
                gap: '1.5rem'
            }}>
                <div className="card" style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>Delivery Information</h2>
                    {formData.payment_method === 'credit_card' ? (
                        <Elements stripe={stripePromise}>
                            <CheckoutForm
                                formData={formData}
                                setFormData={setFormData}
                                handleSubmit={handleSubmit}
                                items={items}
                                total={total}
                            />
                        </Elements>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="delivery_address" className="form-label" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Delivery Address*</label>
                                <input
                                    type="text"
                                    id="delivery_address"
                                    name="delivery_address"
                                    value={delivery_address}
                                    onChange={handleChange}
                                    className="form-control"
                                    placeholder="Enter your delivery address"
                                    required
                                    style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="delivery_notes" className="form-label" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Delivery Notes</label>
                                <textarea
                                    id="delivery_notes"
                                    name="delivery_notes"
                                    value={delivery_notes}
                                    onChange={handleChange}
                                    className="form-control"
                                    rows="2"
                                    placeholder="Any special delivery instructions?"
                                    style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Payment Method</label>

                                <div style={{ 
                                    marginTop: '0.5rem', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '0.5rem'
                                }}>
                                    <label style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0.75rem', 
                                        borderRadius: 'var(--border-radius)', 
                                        border: payment_method === 'cash' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', 
                                        backgroundColor: payment_method === 'cash' ? 'var(--bg-color-secondary)' : 'transparent',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="cash"
                                            checked={payment_method === 'cash'}
                                            onChange={handleChange}
                                            style={{ marginRight: '0.75rem' }}
                                        />
                                        <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Cash on Delivery</span>
                                    </label>

                                    <label style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        padding: '0.75rem', 
                                        borderRadius: 'var(--border-radius)', 
                                        border: payment_method === 'credit_card' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', 
                                        backgroundColor: payment_method === 'credit_card' ? 'var(--bg-color-secondary)' : 'transparent',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}>
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="credit_card"
                                            checked={payment_method === 'credit_card'}
                                            onChange={handleChange}
                                            style={{ marginRight: '0.75rem' }}
                                        />
                                        <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>Credit Card</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ 
                                    width: '100%', 
                                    marginTop: '1.5rem',
                                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                                    fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Place Order'}
                            </button>
                        </form>
                    )}
                </div>

                <div style={{ 
                    position: 'sticky', 
                    top: '1rem',
                    height: 'fit-content',
                    alignSelf: 'flex-start'
                }}>
                    <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
                        <h2 style={{ marginBottom: '1rem', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)' }}>Order Summary</h2>
                        <p style={{ color: 'var(--text-color-secondary)', marginBottom: '1rem', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>From {restaurantName}</p>

                        <div style={{ 
                            margin: '1.5rem 0', 
                            borderBottom: '1px solid var(--border-color)', 
                            paddingBottom: '1rem',
                            maxHeight: items.length > 5 ? '200px' : 'auto',
                            overflowY: items.length > 5 ? 'auto' : 'visible',
                            paddingRight: items.length > 5 ? '0.5rem' : '0'
                        }}>
                            {items.map((item) => (
                                <div
                                    key={`${item.type}-${item.id || item.customMealId}-checkout`}
                                    style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        marginBottom: '0.75rem',
                                        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)'
                                    }}
                                >
                                    <span style={{ 
                                        maxWidth: '70%', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        whiteSpace: 'nowrap' 
                                    }}>{item.name} x {item.quantity}</span>
                                    <span style={{ fontWeight: '500' }}>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            fontWeight: 'bold', 
                            fontSize: 'clamp(1.1rem, 2.5vw, 1.2rem)', 
                            padding: '0.5rem 0',
                            marginBottom: '0.5rem'
                        }}>
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;