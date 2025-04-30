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
                        <CardElement id="card-element" className="form-control" />
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
        <div className="checkout-page">
            <h1>Checkout</h1>

            {error && (
                <div className="alert alert-danger">
                    {typeof error === 'object' ? Object.values(error).flat().join(', ') : error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                <div className="checkout-form">
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
                                <label htmlFor="delivery_address" className="form-label">
                                    Delivery Address
                                </label>
                                <textarea
                                    id="delivery_address"
                                    name="delivery_address"
                                    value={delivery_address}
                                    onChange={handleChange}
                                    className="form-control"
                                    rows="3"
                                    required
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label htmlFor="delivery_notes" className="form-label">
                                    Delivery Notes (Optional)
                                </label>
                                <textarea
                                    id="delivery_notes"
                                    name="delivery_notes"
                                    value={delivery_notes}
                                    onChange={handleChange}
                                    className="form-control"
                                    rows="2"
                                    placeholder="Any special delivery instructions?"
                                ></textarea>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Payment Method</label>

                                <div style={{ marginTop: '0.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="cash"
                                            checked={payment_method === 'cash'}
                                            onChange={handleChange}
                                            style={{ marginRight: '0.5rem' }}
                                        />
                                        Cash on Delivery
                                    </label>

                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value="credit_card"
                                            checked={payment_method === 'credit_card'}
                                            onChange={handleChange}
                                            style={{ marginRight: '0.5rem' }}
                                        />
                                        Credit Card
                                    </label>

                                    
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: '1.5rem' }}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Place Order'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="order-summary">
                    <div className="card">
                        <div className="card-body">
                            <h2>Order Summary</h2>
                            <p>From {restaurantName}</p>

                            <div style={{ margin: '1.5rem 0', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                                {items.map((item) => (
                                    <div
                                        key={`${item.type}-${item.id || item.customMealId}-checkout`}
                                        style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}
                                    >
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;