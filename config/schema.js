
module.exports = {
    "required": true,
    "type": "object",
    "properties": {
        "port": {
            "minimum": 1,
            "maximum": 65535,
            "type": "number"
        },
        "rest_server_url": {
            "required": true,
            "type": "string"
//            "format": "url"
        },

        // database settings
        "db": {
            "required": true,
            "type": "object",
            "properties": {
                "production": {
                    "required": true,
                    "type": "string"
//                    "format": "url"
                },
                "test": {
                    "required": true,
                    "type": "string"
//                    "format": "url"
                }
            }
        },

        "session_secret": {
            "required": true,
            "type": "string"
        },

        "smtp": {
            "type": "object",
            "properties":{
                "host":{
                    "type": "string"
                },
                "port": {
                    "type": "integer"
                },
                "secure_connection":{
                    "type": "boolean"
                },
                "username": {
                    "type": "string"
                },
                "password": {
                    "type": "string"
                },
                "admin_email": {
                    "type": "string"
                }
            }
        },

        // ssl options
        "enable_ssl": {
            "type": "boolean"
        },
        "server_certificate": {
            "required": true,
            "type": "string"
        },
        "private_key": {
            "required": true,
            "type": "string"
        },
        "private_key_pass": {
            "type": "string"
        },
        "ca_cert": {
            "type": "string"
        },

        // authentication options
        "authentication_type": {
            "required": true,
            "type": "string",
            "enum": [ 'password', 'pam', 'certificate' ]
        },
        "max_session_length": {
            "required": true,
            "type": "integer"
        },
        "jwt_signing_alg": {
            "required": true,
            "type": "string",
            "enum": [ 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512' ]
        },
        "behind_reverse_proxy": {
            "type": "boolean"
        },
        "pam_service": {
            "default": "maas",
            "type": "string"
        },

        // vm settings
        "vm_port": {
            "type": "number",
            "minimum": 1,
            "maximum": 65535
        },
        "vm_idle_ttl": {
            "type": "number"
        },
        "vm_check_interval": {
            "type": "number"
        },

        // maas-server settings
        "proxy_host": {
            "required": true,
            "type": "string"
            //"format": "host-name"
        },
        "proxy_port": {
            "type": "number",
            "minimum": 1,
            "maximum": 65535
        },

        // logging options
        "log_file": {
            "required": true,
            "type": "string"
        },
        "log_level": {
            "type": "string",
            "enum": ["silly", "debug", "verbose", "info", "warn", "error"]
        },

        // cloud API configuration
        "cloud_platform": {
            "required": true,
            "type": "string",
            "enum": ["openstack", "aws"]
        },
        "openstack": {
            "type": "object",
            "properties": {
                "authUrl": {
                    "required": true,
                    "type": "string"
//                    "format": "url"
                },
                "password": {
                    "required": true,
                    "type": "string"
                },
                "tenantId": {
                    // this can cause odd issues, leave it optional
//                    "required": true,
                    "type": "string"
                },
                "tenantName": {
                    "required": true,
                    "type": "string"
                },
                "username": {
                    "required": true,
                    "type": "string"
                },
                "region": {
                    // this can cause odd issues, leave it optional
//                    "required": true,
                    "type": "string"
                }
            }
        },
        "aws": {
            "type": "object",
            "properties": {
                "accessKeyId": {
                    "required": true,
                    "type": "string"
                },
                "secretAccessKey": {
                    "required": true,
                    "type": "string"
                },
                "region": {
                    "required": true,
                    "type": "string"
                },
                "availabilityZone": {
                    "required": true,
                    "type": "string"
                }
            }
        },

        // webrtc options
        "webrtc": {
            "required": true,
            "type": "object",
            "properties": {
                "ice_servers": {
                    "required": true,
                    "minItems": 0,
                    "type": "array",
                    "items": {
                        "required": true,
                        "type": "object",
                        "properties": {
                            "url": {
                                "required": true,
                                // TODO: add pattern validation for stun:host:port URL
                                "type": "string"
                            },
                            "username": {
                                "type": "string"
                            },
                            "password": {
                                "type": "string"
                            }
                        }
                    }
                },
                "pc": {
                    "type": "object"
                },
                "video": {
                    "type": "object"
                }
            }
        }

    }
};
