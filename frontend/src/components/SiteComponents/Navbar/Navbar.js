import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Form, Button, FormControl, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { generateRoomName } from '../../../modules/util';
import { SocketContext } from '../../../modules/socketContexts';
import styles from './Navbar.module.scss';
import favicon from '../../../assets/icons/favicon.png'


const Our_Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation('translations');
    const [serverClientID, serverSocket] = useContext(SocketContext);
    const [roomID, setRoomID] = useState("");
    const [navExpanded, setNavExpanded] = useState(false);

    // state variables for number of connected players
    const [numConnected, setNumConnected] = useState(-1);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // get data from socket
        serverSocket.on("numClientsPlayingUpdate", updateNumConnected);
        serverSocket.emit('getNumClientsPlaying');

        setIsConnected(true);
        return (() => {
            serverSocket.off("numClientsPlayingUpdate", updateNumConnected);
        })
    }, [serverClientID, serverSocket]);

    const updateNumConnected = (args) => {
        setNumConnected(args)
    }

    const handleSubmit = (evt) => {
        if (roomID) navigate(`/belote/room/${roomID}`);
        evt.stopPropagation();
        setRoomID("");
    }

    const inRoom = window.location.toString().includes("/belote/lobby/") ||
        window.location.toString().includes("/belote/game/")

    const handleRandomRoomClick = () => {
        if (!inRoom) {
            let destRoom = generateRoomName();
            navigate(`/belote/lobby/${destRoom}`);
            setNavExpanded(false)
        };
    }

    // get local language settings
    const getLanguage = () => i18n.language || window.localStorage.i18nextLng;


    return (
        <Navbar bg="light" expand="lg" expanded={navExpanded}>
            <Navbar.Brand>
                <LinkContainer to={'/'}>
                    {/* {t('navbar.brand')} */}
                    <Nav.Link>

                        <div>
                            <img src={favicon} className={styles.logo} alt="fireSpot" />
                        </div>
                    </Nav.Link>
                </LinkContainer>
            </Navbar.Brand>
            {/*
            isConnected represent connection attempt, not actual connection - rely on 
            check in server that guarantees never less than 0 players connected 
            */}
            {isConnected &&
                <div>
                    {(numConnected > 0) &&
                        <div className={styles.playersOnlineIndicator}>
                            <a className={styles.onlineIcon}>{'\u25CF'} </a> {numConnected} {t('navbar.playersOnline')}
                        </div>
                    }
                    {(numConnected === 0) &&
                        <div className={styles.playersOnlineIndicator}>
                            <a className={styles.onlineIcon}>{'\u25CF'} </a> {t('navbar.connected')}
                        </div>
                    }
                    {(numConnected === -1) &&
                        <div className={styles.playersOnlineIndicator}>
                            <a className={styles.offlineIcon}>{'\u25CF'} </a> {t('navbar.disconnected')}
                        </div>
                    }
                </div>
            }
            {/* controlling navbar expansion state manually to allow for collapse only on certain events  */}
            <Navbar.Toggle aria-controls="basic-navbar-nav"
                onClick={() => { setNavExpanded(!navExpanded) }}
            />
            <Navbar.Collapse id="basic-navbar-nav" >
                <Nav className="mr-auto">
                    <LinkContainer to={'/'}>
                        <Nav.Link>
                            {t('navbar.home')}
                        </Nav.Link>
                    </LinkContainer>
                    {/* only show new room button if not currently entering room */}
                    {(!inRoom) &&
                        <Nav.Link onClick={handleRandomRoomClick}>{t('navbar.create_new_room')}</Nav.Link>
                    }
                </Nav>
                <Nav>
                    <NavDropdown title={t('navbar.lang')}>
                        {(getLanguage() !== 'fr') &&
                            <NavDropdown.Item>
                                <div onClick={() => { i18n.changeLanguage("fr") }}>
                                    {t('navbar.langs.fr')}
                                </div>
                            </NavDropdown.Item>
                        }
                        {(getLanguage() !== 'bg') &&
                            <NavDropdown.Item>
                                <div onClick={() => { i18n.changeLanguage("bg") }}>
                                    {t('navbar.langs.bg')}
                                </div>
                            </NavDropdown.Item>
                        }
                        {(getLanguage() !== 'en') &&
                            <NavDropdown.Item>
                                <div onClick={() => { i18n.changeLanguage("en") }}>
                                    {t('navbar.langs.en')}
                                </div>
                            </NavDropdown.Item>
                        }
                    </NavDropdown>
                </Nav>

                {/* <Form inline>
                    <FormControl
                        type="text"
                        placeholder={t('navbar.gameIDLabel')}
                        className="mr-sm-2"
                        onChange={(evt) => { setRoomID(evt.target.value) }}
                        value={roomID}
                    />
                    <br />
                    <Button
                        onClick={handleSubmit}
                        type="submit"
                        variant="primary"
                        disabled={(!roomID)}
                    >
                        {t('navbar.joinGameBtnLabel')}
                    </Button>
                </Form> */}
            </Navbar.Collapse>
        </Navbar >
    );
}

export default Our_Navbar;