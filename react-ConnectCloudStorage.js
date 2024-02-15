import { Button, Col, Form, Input, Modal, Row } from 'antd';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { connectCloudStorage } from '../../../../redux/actions';
import {
  awsIcon,
  blackblazeIcon,
  digitalOceanIcon,
  genericIcon,
  googleCloudStorageIcon,
  upCloudIcon,
  wasabiIcon,
} from '../../../../utils/svg-icons';

const ConnectCloudStorage = ({ visible, onClose }) => {
  //Redux Dispatch
  const dispatch = useDispatch();

  const [type, setType] = useState('AWS');
  const [connecting, setConnecting] = useState(false);
  const onFinish = async (vendor, values) => {
    const {
      name,
      accessKeyId,
      secretAccessKey,
      bucket,
      endpoint,
      region,
      projectId,
      gcpPrivateKeyId,
    } = values;

    const payload = {
      vendor,
      name,
      accessKeyId,
      secretAccessKey,
    };

    setConnecting(true);

    if (bucket) payload['bucket'] = bucket;

    if (projectId) payload['projectId'] = projectId;

    if (endpoint) payload['endpoint'] = endpoint;

    if (region) payload['region'] = region;

    if (gcpPrivateKeyId) payload['gcpPrivateKeyId'] = gcpPrivateKeyId;

    const response = await dispatch(connectCloudStorage(payload));
    setConnecting(false);
    if (response) {
      onClose();
    }
  };

  const onFinishFailed = (data) => {
    setConnecting(false);
  };

  return (
    <Modal
      className={'participant-req-modal'}
      closable={false}
      width={620}
      visible={visible}
      onCancel={onClose}
    >
      <div>
        <h3 className={'m15'}>Configure Cloud Storage</h3>
      </div>
      <div className={'information-box'}>
        <Button className={type === 'GCS' ? 'selected' : ''} onClick={() => setType('GCS')}>
          {googleCloudStorageIcon}
        </Button>
        <Button className={type === 'WASABI' ? 'selected' : ''} onClick={() => setType('WASABI')}>
          {wasabiIcon}
        </Button>
        <Button
          className={type === 'BACKBLAZE' ? 'selected' : ''}
          onClick={() => setType('BACKBLAZE')}
        >
          {blackblazeIcon}
        </Button>
        <Button
          className={type === 'DIGITALOCEAN' ? 'selected' : ''}
          onClick={() => setType('DIGITALOCEAN')}
        >
          {digitalOceanIcon}
        </Button>
        <Button className={type === 'AWS' ? 'selected' : ''} onClick={() => setType('AWS')}>
          {awsIcon}
        </Button>
        <Button className={type === 'UPCLOUD' ? 'selected' : ''} onClick={() => setType('UPCLOUD')}>
          {upCloudIcon}
        </Button>
        <Button className={type === 'GENERIC' ? 'selected' : ''} onClick={() => setType('GENERIC')}>
          {genericIcon}
        </Button>
      </div>
      <div className={'divider mt10'} />
      <div style={{ padding: '15px 30px 0px' }}>
        {type !== 'GCS' && (
          <ConnectS3Storage
            type={type}
            onFinish={onFinish}
            connecting={connecting}
            handleCancel={onClose}
            onFinishFailed={onFinishFailed}
          />
        )}
        {type === 'GCS' && (
          <ConnectGCSStorage
            type={type}
            onFinish={onFinish}
            connecting={connecting}
            handleCancel={onClose}
            onFinishFailed={onFinishFailed}
          />
        )}
      </div>
    </Modal>
  );
};

const ConnectS3Storage = ({ type, onFinish, handleCancel, connecting, onFinishFailed }) => {
  return (
    <Form
      name="connect-s3-cloud-storage"
      layout="vertical"
      className={'form-style'}
      onFinish={(values) => onFinish(type, values)}
      onFinishFailed={onFinishFailed}
      requiredMark={false}
    >
      <Form.Item
        name="name"
        label="Name"
        rules={[
          {
            required: true,
            message: 'Please input storage name',
          },
        ]}
      >
        <Input placeholder="Storage Name" />
      </Form.Item>

      <Form.Item
        name="accessKeyId"
        label={'Access Key iD'}
        rules={[
          {
            required: true,
            message: 'Please input access key id',
          },
        ]}
      >
        <Input placeholder="Access Key Id" />
      </Form.Item>

      <Form.Item
        name="secretAccessKey"
        label={'Secret Access Key'}
        rules={[
          {
            required: true,
            message: 'Please input secret access key',
          },
        ]}
      >
        <Input placeholder="Secret Access Key" />
      </Form.Item>
      <Form.Item
        name="endpoint"
        label="Endpoint"
        rules={[
          {
            required: ['DIGITALOCEAN', 'UPCLOUD'].includes(type) ? true : false,
            message: 'Please input end point',
          },
        ]}
      >
        <Input placeholder="End Point" />
      </Form.Item>
      <Row gutter={15}>
        <Col span={12}>
          <Form.Item
            name="region"
            label={'Region'}
            rules={[
              {
                required: ['Generic'].includes(type) ? true : false,
                message: 'Please input region',
              },
            ]}
          >
            <Input placeholder="Region" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="bucket"
            label={'Bucket'}
            rules={[
              {
                required: true,
                message: 'Please input bucket',
              },
            ]}
          >
            <Input placeholder="Bucket" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item className="text-right">
        <div className="d-flex justify-content-end">
          <Button
            onClick={handleCancel}
            disabled={connecting}
            type="default"
            id="connect-cloud-storage-cancel-btn"
            className="mr10 ant-btn-default"
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={connecting}>
            Connect Storage
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

const ConnectGCSStorage = ({ type, onFinish, handleCancel, connecting, onFinishFailed }) => {
  return (
    <Form
      name="connect-gcs-cloud-storage"
      layout="vertical"
      className={'form-style'}
      onFinish={(values) => onFinish(type, values)}
      onFinishFailed={onFinishFailed}
      requiredMark={false}
    >
      <Row gutter={15}>
        <Col span={12}>
          <Form.Item
            name="name"
            label={'Name'}
            rules={[
              {
                required: true,
                message: 'Please input storage name',
              },
            ]}
          >
            <Input placeholder="Storage Name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="bucket"
            label={'Bucket'}
            rules={[
              {
                required: true,
                message: 'Please input bucket',
              },
            ]}
          >
            <Input placeholder="Bucket" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="accessKeyId"
        label={'Client Email'}
        rules={[
          {
            required: true,
            message: 'Please input Client Email',
          },
        ]}
      >
        <Input placeholder="Client Email" />
      </Form.Item>
      <Form.Item
        name="projectId"
        label={'Project ID'}
        rules={[
          {
            required: true,
            message: 'Please input project id',
          },
        ]}
      >
        <Input placeholder="Project Id" />
      </Form.Item>
      <Form.Item
        name="gcpPrivateKeyId"
        label={'GCP Private Key ID'}
        rules={[
          {
            required: true,
            message: 'Please input GCP private key id',
          },
        ]}
      >
        <Input type={'textarea'} placeholder="GCP Private Key Id" />
      </Form.Item>
      <Form.Item
        name="secretAccessKey"
        label={'Private Key'}
        rules={[
          {
            required: true,
            message: 'Please input private key',
          },
        ]}
      >
        <Input.TextArea type={'textarea'} placeholder="Private Key" />
      </Form.Item>
      <Form.Item className="text-right">
        <div className="d-flex justify-content-end">
          <Button
            onClick={handleCancel}
            disabled={connecting}
            type="default"
            className="mr10 ant-btn-default"
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={connecting}>
            Connect Storage
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default ConnectCloudStorage;

