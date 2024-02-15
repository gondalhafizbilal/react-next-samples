import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Progress, Upload } from 'antd';
import { t } from 'i18next';
import { Fragment, useState } from 'react';
import {
  getPresignedUrlAPI,
  getFileUploadStatusAPI,
  getSignedUrlAPI,
  getUpload,
  uploadAssetApi,
} from '../../../../service/asset';
import { openNotificationWithIcon } from '../../../../utils/common-functions';

const CustomUpload = ({
  id,
  assetType,
  icon,
  name,
  thumbnail,
  size,
  accept,
  className,
  showUploadList,
  onSuccess,
  row,
  getLoading,
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadType, setUploadType] = useState('');
  const [processing, setProcessing] = useState(false);
  const uploadButton = (
    <Fragment>
      <div className="logo-upload-text">
        {loading ? <LoadingOutlined style={{ fill: '#e5164f' }} /> : icon ? icon : <PlusOutlined />}
      </div>
    </Fragment>
  );

  const handleVideoChange = async (info) => {
    const file = info?.file;
    if (!file) return;
    if (info && info.size > 20000000) {
      openNotificationWithIcon('error', 'Error', 'Video must be smaller than 20MB!');
      return;
    }
    await uploadToS3(assetType, file.type, file);
  };
  const checkFileUploadStatus = async (presignedPostUrl) => {
    let getFileUploadStatus = await getFileUploadStatusAPI(presignedPostUrl.videoId);
    if (getFileUploadStatus && getFileUploadStatus.status) {
      return getFileUploadStatus;
    }
  };
  const uploadToS3 = async (type, fileType, fileContents) => {
    setLoading(true);
    const presignedPostUrl = await getPresignedUrlAPI(fileContents.name, type);

    return new Promise((resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        const metaHeaders = presignedPostUrl.metaHeaders;
        xhr.open('PUT', presignedPostUrl.presignedURL, true);

        xhr.upload.onprogress = function (evt) {
          if (evt.lengthComputable) {
            var percentComplete = parseInt((evt.loaded / evt.total) * 100);
            setProgress(percentComplete);
          }
        };

        Object.keys(metaHeaders).forEach((key) => {
          xhr.setRequestHeader(key, metaHeaders[key]);
        });
        xhr.onload = () => {
          if (xhr.status === 200) {
            setLoading(false);
            setProgress(0);
            setProcessing(true);
            var fileUploadInterval = setInterval(async () => {
              try {
                const getFileUploadStatus = await checkFileUploadStatus(presignedPostUrl);
                if (getFileUploadStatus) {
                  setProgress(getFileUploadStatus.downloaded);
                  const status = getFileUploadStatus.status;
                  if (status === 'IDLE') {
                    clearInterval(fileUploadInterval);
                    await getVideoFileUrl(presignedPostUrl.videoId);
                    resolve();
                  } else if (status === 'DOWNLOADING_FAILED' || status === 'PROCESSING_FAILED') {
                    clearInterval(fileUploadInterval);
                    setProgress(0);
                    setProcessing(false);
                    getLoading && getLoading(false);
                    resolve();
                  }
                }
              } catch (message) {
                setLoading(false);
                getLoading && getLoading(false);
                setProcessing(false);
                // eslint-disable-next-line no-console
                return console.error(message);
              }
            }, 1000);
          }
        };
        xhr.onerror = (error) => {
          // eslint-disable-next-line no-console
          console.log({ error });
          setLoading(false);
          getLoading && getLoading(false);
          setProcessing(false);
          setProgress(0);
          reject();
        };
        xhr.send(fileContents);
      } catch (err) {
        setLoading(false);
        getLoading && getLoading(false);
        // eslint-disable-next-line no-console
        console.log({ err });
      }
    });
  };

  const getVideoFileUrl = async (id) => {
    try {
      const fileData = await getUpload(id);
      const response = await getSignedUrlAPI(id);
      if (onSuccess && fileData && response.success)
        onSuccess({ id, url: response.data.url, thumbnail: fileData.thumbnail, type: 'video' });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
    setLoading(false);
    getLoading && getLoading(false);
    setProcessing(false);
    setProgress(0);
  };

  const handleImageSelect = async (info) => {
    return new Promise((resolve, reject) => {
      const file = info.file;
      const img = new Image();
      img.src = window.URL.createObjectURL(file);
      img.onload = async () => {
        if (img.width > 1920 || img.height > 1080) {
          openNotificationWithIcon(
            'error',
            'Error',
            <span>{t('logo-invalid-dimensions-error')}</span>
          );
          setLoading(false);
          getLoading && getLoading(false);
          return;
        } else if (file && file.size > 5000000) {
          openNotificationWithIcon('error', 'Error', <span>{t('logo-invalid-size-error')}</span>);
          setLoading(false);
          getLoading && getLoading(false);
          return;
        } else {
          const formData = new FormData();
          formData.append('name', 'asset_logo');
          formData.append('asset_logo', file);
          formData.append('asset_name', file.name);
          formData.append('asset_type', assetType);
          const result = await uploadAssetApi(formData);
          if (result && result.url) {
            resolve({ id: result.uuid, url: result.url });
          } else {
            openNotificationWithIcon('error', 'Error', 'Image not uploaded!');
            setLoading(false);
            getLoading && getLoading(false);
            reject();
          }
        }
      };
    });
  };

  const customRequest = async (info) => {
    getLoading && getLoading(true);
    setUploadType(info.file.type);
    try {
      if (info.file.type.includes('video')) {
        handleVideoChange(info);
      } else if (info.file.type.includes('image')) {
        setLoading(true);
        const response = await handleImageSelect(info);
        if (onSuccess && response && response?.url) {
          onSuccess({
            id: response?.id ?? -1,
            url: response.url,
            thumbnail: response.url,
            type: 'image',
          });
        }
        setLoading(false);
        getLoading && getLoading(false);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log({ err });
    }
  };
  const onUploadSuccess = () => {
    //
  };
  return (
    <Upload
      id={id}
      name={name}
      listType="picture-card"
      className={className}
      showUploadList={showUploadList}
      accept={accept}
      customRequest={customRequest}
      style={{ transform: `scale(2)` }}
      onSuccess={onUploadSuccess}
      disabled={loading || processing}
    >
      <div
        className={`d-flex ${
          !row && 'flex-col'
        } align-item-center full-width full-height justify-content-center`}
        style={{ transform: `scale(${size ?? 1})` }}
      >
        {(loading || processing) && uploadType.includes('video') ? (
          <Progress
            trailColor={'#e5164f'}
            strokeColor={'#e5164f'}
            type={'circle'}
            percent={progress}
            width={26}
          />
        ) : !thumbnail ? (
          uploadButton
        ) : null}
        {loading || processing
          ? null
          : thumbnail && (
              <img
                src={thumbnail}
                alt={'thumbnail'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 5 }}
              />
            )}
        {(loading || processing) && (
          <label className={`fs-8 ${row && 'mt5'} ${row && 'ml5'}`}>
            {processing ? 'Processing...' : 'Uploading...'}
          </label>
        )}
      </div>
    </Upload>
  );
};

export default CustomUpload;

