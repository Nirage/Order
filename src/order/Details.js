import React, { Component } from 'react';
import PropTypes from 'prop-types';
// Imported order files
import Msg from '../Messages';

export default class Details extends Component {
    render() {
        this.msg = new Msg();
        const { data } = this.props;
        const { unconsignedEntries, consignments } = data;

        const UnconsignedComp = () => {
            return <div className="product-table__unconsigned">
                {
                    unconsignedEntries.map(entry => {
                        const {
                            product, cancelled, quantity, shippedQuantity
                        } = entry;
                        const href = product.purchasable && product.url;
                        const img = product.images && product.images[0];
                        const url = img ? img.url : this.msg.missingProductImage;
                        const altText = img && img.altText;
                        return <div className="product-table__item row" key={product.code}>
                            <div className="product-table__item-white col-xs-12 col-md-9">
                                {cancelled && <div className="product-table__item--cancelled" />}
                                <div className="col-xs-12 row">
                                    <div className="product-table__item-image product-table__item-image--alt col-xs-4 col-md-3">
                                        <a href={href}>
                                            <img className="img-responsive img__item omit-object-fit" src={url} alt={altText} title={altText} />
                                        </a>
                                    </div>
                                    <div className="col-xs-8 col-md-9">
                                        <a className="product-table__item-anchor" href={href}>
                                            <h3 className="product-table__item-name">{product.name}</h3>
                                        </a>Qty: {shippedQuantity && shippedQuantity !== quantity
                                            ? <span><strong>{shippedQuantity}</strong> of {quantity}</span>
                                            : <strong>{quantity}</strong>}
                                    </div>
                                </div>
                            </div>
                        </div>;
                    })
                }
            </div>;
        };

        const ConsignmentComp = () => {
            return consignments.map((entry, index) => {
                const {
                    status, entries, showTrackPackage, courierUrl
                } = entry;
                const statusDisplay = entry.statusDisplay ? entry.statusDisplay : this.msg.unknown;
                return <div className="product-table__consignment" key={index}>
                    <div className="product-table__item row">
                        { entries.map(list => {
                            const { quantity, shippedQuantity, orderEntry } = list;
                            const { product, cancelled } = orderEntry;
                            const href = product.purchasable && product.url;
                            const img = product.images && product.images[0];
                            const url = img ? img.url : this.msg.missingProductImage;
                            const altText = img && img.altText;
                            return <div key={product.code} className="product-table__item-white col-xs-12 col-md-9">
                                {cancelled || (status && status.code === 'CANCELLED') ? <div className="product-table__item--cancelled" /> : ''}
                                <div className="col-xs-12 row">
                                    <div className="product-table__item-image product-table__item-image--alt col-xs-4 col-md-3">
                                        <a href={href}>
                                            <img className="img-responsive img__item omit-object-fit" src={url} alt={altText} title={altText} />
                                        </a>
                                    </div>
                                    <div className="col-xs-8 col-md-9">
                                        <a className="product-table__item-anchor" href={href}>
                                            <h3 className="product-table__item-name">{product.name}</h3>
                                        </a>Qty: {shippedQuantity && shippedQuantity !== quantity
                                            ? <span><strong>{shippedQuantity}</strong> of {quantity}</span>
                                            : <strong>{quantity}</strong>}
                                    </div>
                                </div>
                            </div>;
                        }) }
                        <div className="product-table__item-center col-xs-12 col-md-3">
                            {this.msg.orderStatus}: <p className="product-table__item-bold">{statusDisplay}</p>
                            {showTrackPackage && <a
                              href={courierUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="contentblock__btn btn btn-default hidden-xs hidden-sm"
                            >{this.msg.trackPackage}</a>}
                        </div>
                        {showTrackPackage && <a
                          href={courierUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="contentblock__btn btn btn-default hidden-md hidden-lg"
                        >{this.msg.trackPackage}</a>}
                    </div>
                </div>;
            });
        };

        return <div>
            { unconsignedEntries.length ? <UnconsignedComp /> : '' }
            { consignments ? <ConsignmentComp /> : '' }
        </div>;
    }
}

Details.propTypes = {
    data: PropTypes.oneOfType([
        PropTypes.arrayOf(
            PropTypes.shape().isRequired
        ),
        PropTypes.shape().isRequired
    ])
};

Details.defaultProps = {
    data: {}
};