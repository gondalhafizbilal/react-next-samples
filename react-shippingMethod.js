/**
 * Component for the page where the customer selects
 * the Return Method (e.g. shipping label). This page
 * also shows any label- or restocking fees to the customer
 * if these have been enabled by our user.
 * 
 * @component
 */

import React from "react";
import { Row, Col, Radio, Card, Divider, Button, Select, message } from "antd";
import axios from "axios";
import { FormattedMessage } from "react-intl";
import '../../styles/Visitor.css';

const RadioGroup = Radio.Group;
const { Option } = Select;

class Method extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      methodInStore: undefined,
      methodLabelCreation: undefined,
      methodLabelManual: undefined,
      methodCustomerChoice: undefined,
      value: undefined,
      dropdownWidth: 400,
      submitButtonDisabled: false,
      submitButtonLoading: false,
    };
  }

  async componentDidMount() {
    // scroll to top of page
    window.scrollTo(0, 0);
    
    const { companyIdentifier, returnNumber } = this.props;

    try {

      const response = await axios.post("/api/visitors/return/shipping", {
        companyIdentifier,
        returnNumber
      });
      if (response.data.status === "error") {
        return message.error("There was an error loading your shipping options. Please try again.", 5);
      }

      const updatedReturn = response.data.returnData;

      this.setState( (prevState) => ({
        ...prevState,
        ...response.data.availableShippingMethods,
      }));

      return this.props.updateBrandSettings({
        returnData: updatedReturn,
      });

    } catch(err) {
        return message.error("There was an error loading your shipping options. Please try again.", 5);
    }
  }

  handleSubmit = async () => {
    const { companyIdentifier, returnNumber } = this.props;
    const selectedMethod = this.state.value;

    if (selectedMethod === undefined) {
      return message.error("Please select a method to return your order.", 5);
    }

    try {

      this.setState({
        submitButtonDisabled: true,
        submitButtonLoading: true,
      });

      const response = await axios.post("/api/visitors/return/shipping/update", {
        companyIdentifier,
        returnNumber,
        selectedMethod,
      });
      if (response.data.status === "error") {
        this.setState({
          submitButtonDisabled: false,
          submitButtonLoading: false,
        });
        return message.error("There was an error communicating with the server. Please try again.", 4);
      }
      return this.props.history.push('/return/status');
    } catch(err) {
      this.setState({
        submitButtonDisabled: false,
        submitButtonLoading: false,
      });
      return message.error("There was an error communicating with the server. Please try again.", 4);
    }
  }

  handleChange  = (value) => {
    this.setState({
      value,
    });
  }

  render() {
    const radioStyle = {
     display: 'block',
     height: '30px',
     lineHeight: '30px',
    };

    return(
      <React.Fragment>
        <Card
          title={
            <FormattedMessage
              id="app.visitor.method.headline"
              description="Title of the fourth step of the return-portal process 'shipping method'"
              defaultMessage="How would you like to return your order?"
            />
          }
          className="textCenter"
        >
          <Row type="flex" justify="center" align="top">
            <Col>
              <Select
                id="selectReturnMethodDropdown"
                size="large"
                value={this.state.value}
                placeholder={
                  <FormattedMessage
                    id="app.visitor.method.titleOfDropdown"
                    description="Shipping method selection dialog: title of the dropdown menu"
                    defaultMessage="Select how to return your order"
                  />
                }
                onChange={this.handleChange.bind(this)}
              >
                {
                  this.state.methodLabelCreation
                  ? (<Option value="methodLabelCreation">
                      <FormattedMessage
                        id="app.visitor.method.methodLabelCreation"
                        description="Shipping method selection dialog: pre-paid return label (automatic)"
                        defaultMessage="Ship via pre-paid return label"
                      />
                    </Option>)
                  : ""
                }
                {
                  this.state.methodLabelManual
                  ? (<Option value="methodLabelManual">
                      <FormattedMessage
                        id="app.visitor.method.methodLabelManual"
                        description="Shipping method selection dialog: pre-paid return label (manual)"
                        defaultMessage="Ship via pre-paid return label"
                      />
                    </Option>)
                  : ""
                }
                {
                  this.state.methodCustomerChoice
                  ? (<Radio value="methodCustomerChoice">
                      <FormattedMessage
                        id="app.visitor.method.methodCustomerChoice"
                        description="Shipping method selection dialog: customer chooses carrier"
                        defaultMessage="Ship with the carrier of your choice"
                      />
                    </Radio>)
                  : ""
                }
                {
                  this.state.methodInStore
                  ? (<Radio value="methodInStore">
                      <FormattedMessage
                        id="app.visitor.method.methodInStore"
                        description="Shipping method selection dialog: in store return"
                        defaultMessage="Return in a local store"
                      />
                    </Radio>)
                  : ""
                }
              </Select>
            </Col>
          </Row>
          <Divider />
          <Row type="flex" justify="center" align="top">
            <Col>
              {
                this.props.returnSettings.restockingFeeEnabled || (this.props.returnData && this.props.returnData.ruleActionCustomRestockingFee)
                ? (
                  <Row type="flex" justify="center" align="top">
                    <Col>
                      <p>
                        <strong>{parseFloat(this.props.returnData.restockingFeeValue).toFixed(2)} {this.props.orderData.currency} </strong>
                        <FormattedMessage
                          id="app.visitor.resolutions.infoRestockingFee"
                          description="Shipping method selection dialog: info about restocking-fee (optional)"
                          defaultMessage="restocking-fee applies."
                        />
                      </p>
                    </Col>
                  </Row>
                )
                : ""
              }
              {
                (this.state.value === "methodLabelCreation" || this.state.value === "methodLabelManual") && (this.props.returnSettings.labelFeeEnabled || (this.props.returnData && this.props.returnData.ruleActionCustomLabelFee))
                ? (
                    <p>
                      <strong>{parseFloat(this.props.returnData.labelFeeValue).toFixed(2)} {this.props.orderData.currency} </strong>
                      <FormattedMessage
                        id="app.visitor.method.infoLabelFee"
                        description="Shipping method selection dialog: info about label-fee (optional)"
                        defaultMessage="label-fee applies for the prepaid shipping-label we provide you."
                      />
                    </p>
                  )
                : ""
              }
              <p>
                <FormattedMessage
                  id="app.visitor.method.infoViaEmail"
                  description="Shipping method selection dialog: info to user that they receive instructions via email"
                  defaultMessage="We will send you the instructions via e-mail once your request has been approved."
                />
              </p>
            </Col>
          </Row>
          <Divider />
          <Row type="flex" justify="center" align="top">
            <Col>
              {
                this.state.submitButtonLoading
                ? <Button shape="circle" loading={this.state.submitButtonLoading} style={{ marginRight: 20 }}/>
                : null
              }
              <Button
                type="primary"
                onClick={ this.handleSubmit }
                disabled={this.state.submitButtonDisabled}
                style={{ backgroundColor: this.props.brandColorButton, borderColor: this.props.brandColorButton }}
              >
                {
                  this.state.submitButtonLoading
                  ? (
                    <span style={{ color: this.props.brandColorButtonText }}>
                      <FormattedMessage
                        id="app.visitor.method.buttonSubmitLoading"
                        description="Shipping method selection dialog: submit button is loading..."
                        defaultMessage="Creating your return..."
                      />
                    </span>
                  )
                  : (
                    <span style={{ color: this.props.brandColorButtonText }}>
                      <FormattedMessage
                        id="app.visitor.method.buttonSubmit"
                        description="Shipping method selection dialog: submit button"
                        defaultMessage="Submit"
                      />
                    </span>
                  )
                }
              </Button>
            </Col>
          </Row>
        </Card>
      </React.Fragment>
    );
  }
}

export default Method;

