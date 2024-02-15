import React, { useContext, useEffect } from 'react';
import { MoreOutlined, EditOutlined } from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import { motion, useCycle } from 'framer-motion';
import { sideBarToggleVariant, sideBarVariant } from '../../../../../utils/framer-motion-variants';
import { DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { ParticipantContext } from '../../../../../contexts';
import noSignal from '../../../../../statics/images/noSignal.jpeg';
import { updateSidebarFooterToggle } from '../../../../../redux/actions';
import { connect, useDispatch } from 'react-redux';
import { sidebarIcon } from '../../../../../utils/svg-icons';

const ParticipantVideoBoxes = ({
  videoStream,
  screenShareStream,
  showNameModal,
  //redux state
  toggleBar,
}) => {
  const [show, cycleShow] = useCycle(true, false);
  const participantContext = useContext(ParticipantContext);
  const dispatch = useDispatch();
  const { localVideoStream } = participantContext;

  useEffect(() => {
    if (!localVideoStream) return;
    window.localStream = localVideoStream;
    let video = document.getElementById(`participant-video-main`);
    if (video) {
      video.srcObject = localVideoStream;
      video.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localVideoStream]);

  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<EditOutlined />} onClick={showNameModal}>
        Edit Name
      </Menu.Item>
    </Menu>
  );

  const handleCycleShow = () => {
    cycleShow();
    dispatch(
      updateSidebarFooterToggle({
        ...toggleBar,
        left: !show,
      })
    );
  };

  return (
    <div className="video-boxes-wrapper participant-video-box-height">
      <motion.div
        className={'position-absolute show-button d-flex align-item-center justify-content-center'}
        onClick={handleCycleShow}
        variants={sideBarToggleVariant}
        animate={show ? 'animateOpen' : 'animateClose'}
      >
        {sidebarIcon}
        <div className={'position-absolute sidebar-text'}>
          {show ? <DoubleLeftOutlined /> : <DoubleRightOutlined />}
          <p>{show ? 'Hide' : 'Show'}</p>
        </div>{' '}
      </motion.div>
      <motion.div
        className={'video-boxes-wrapper-inner'}
        variants={sideBarVariant}
        initial={'initial'}
        animate={show ? 'animateIn' : 'animateOut'}
        exit={'exit'}
      >
        <div className="video-boxes-inner">
          <div className="video-box">
            <div className="box">
              {/* <video className="full-width" id="participant-video" controls={false} muted>
                  Your browser does not support HTML video.
                </video> */}
              {participantContext.camera || participantContext.microphone ? (
                <video
                  className="full-width invert-x"
                  id={'participant-video-main'}
                  controls={false}
                  muted={true}
                >
                  {'browser-does-not-support-video-text'}
                </video>
              ) : (
                <img className="full-width" src={noSignal} alt={'some scenerio'} />
              )}
            </div>

            <div className="more-options">
              <Dropdown overlay={menu} trigger={['click']} placement="topCenter" arrow>
                <MoreOutlined style={{ color: 'white' }} />
              </Dropdown>
            </div>
          </div>
          {screenShareStream && (
            <div className="video-box">
              <div className="box">
                <video className="full-width" id="participant-screen-share" controls={false} muted>
                  Your browser does not support HTML video.
                </video>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  toggleBar: state.appControl.toggleBar,
});

export default connect(mapStateToProps)(ParticipantVideoBoxes);

