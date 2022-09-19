import React, { useEffect } from "react";
import { NativeBaseProvider, Box, Button, Image, Text, HStack, Spinner, Heading } from "native-base";
import { launchCamera } from 'react-native-image-picker';
import { NativeModules } from 'react-native';
import Zeroconf from 'react-native-zeroconf'

const { HttpModule } = NativeModules;

const CA_CRT = `-----BEGIN CERTIFICATE-----
MIIDcTCCAlmgAwIBAgIJAKzgMULvx4JtMA0GCSqGSIb3DQEBBQUAMG8xCzAJBgNV
BAYTAklOMRMwEQYDVQQIDApNYWhhcmFzdHJhMQ8wDQYDVQQHDAZNdW1iYWkxEjAQ
BgNVBAoMCUtvaVJlYWRlcjEUMBIGA1UECwwLRGV2ZWxvcG1lbnQxEDAOBgNVBAMM
B0tvaVNjYW4wHhcNMjIwOTE3MDkxMDM1WhcNMzIwOTE0MDkxMDM1WjBvMQswCQYD
VQQGEwJJTjETMBEGA1UECAwKTWFoYXJhc3RyYTEPMA0GA1UEBwwGTXVtYmFpMRIw
EAYDVQQKDAlLb2lSZWFkZXIxFDASBgNVBAsMC0RldmVsb3BtZW50MRAwDgYDVQQD
DAdLb2lTY2FuMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvSTFKKG4
3i8RDmm3i0gOr7gXlDD6WnysNjy8jBqjbGbREd2kb6wc0iq8anP4/bwu5whW01D5
lYtBUGWK2PBRisixi7dYUwCvtiXrdD6VRHzud4kB6oF7zk7PVX5ChdRn7lSi0jV0
Cekxhje2xtiG6ZnqZFB/TN7UO9lUUw3YaxGzFiipAfGEFq8E+WoPaP2+i0pLCDSO
I6/2Wn76mla1sLnzN9tyjxqo2J/8OSuSTMeBZXadBmoo1mlqEy2gdEBAPGBFoe4n
RDvrxVhowwuqSww5NJJS1w5DiKexeLzuX5erPw3CTNEibQlpqWcqEx6zRVKsXjdy
EYLrcFFo7UzOVwIDAQABoxAwDjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBBQUA
A4IBAQAx8quLwq7U5ZN/k3YZ5ph3f9tj+/VItp92CKivShgWDs28foju1QhcxrhU
h12n//iBvbBKyR1wbR1rHmWpVisAHJSJWc9EqCOcDfNz4l4rv3Ros2XieLIQUPNb
fPp8Hiu2FjhWQCxrYFy+ZDQhHldW5FK6GMobjtiUrYS/hPKrxkZlRXfJEWkoRBwy
16qAhVdq9DJ92QOH7rDS3t3edS3uxlMAMkv/FxIlBwlgp/AxrPwGLZ2eCqKUG8Pr
ONfDcmbzm+3zD/VlXtxU170ZIVGp4OgyXkSMcIo8r3HXijDG9xYMP1nQ6j+6CjvI
aKulTcTUvrHzeNO3J2g4M5KE4Q+A
-----END CERTIFICATE-----
`

export default function App() {
  const [host, setHost] = React.useState(null)
  const [imageUrl, setImageUrl] = React.useState(null)

  useEffect(() => {
    const zeroconf = new Zeroconf();
    zeroconf.on('start', () => console.log('The scan has started.'))
    zeroconf.on('stop', () => console.log('The scan has started.'))
    zeroconf.on('resolved', (device) => {
      console.log(device)
      setHost(device.host)
      zeroconf.stop()
    })
    zeroconf.scan(type = 'http', protocol = 'tcp', domain = 'local.');
  }, [])

  const handleUpload = () => {
    launchCamera({
      mediaType: 'photo',
    }, (response) => {
      if (response.assets.length) {
        const asset = response.assets[0]
        const uploadUrl = `https://${host}:8000/upload`;
        const files = [
          {
            name: 'file',
            fileName: asset.fileName,
            uri: asset.uri,
            type: asset.type
          },
        ];

        HttpModule.createSSLClient(CA_CRT, host);
        HttpModule.upload(uploadUrl, {
          files,
          fields: {}
        })
          .then((res) => {
            const result = JSON.parse(res)
            setImageUrl(`https://${host}:8000/uploads/${result.file}`)
          })
      }
    });

  }
  return (
    <NativeBaseProvider>
      <Box flex={1} flexDirection="column" justifyContent="center" alignItems="center">
        {
          host && (
            <Button onPress={handleUpload} marginBottom={5}>Upload</Button>
          )
        }
        {
          !host && (
            <HStack space={2} justifyContent="center">
              <Spinner accessibilityLabel="Loading posts" />
              <Heading color="primary.500" fontSize="md">
                Looking for Edge Device Locally
              </Heading>
            </HStack>
          )
        }
        {
          imageUrl && (
            <>
              {/* <Image
              source={{
                 uri: imageUrl
               }}
               alt="Alternate Text"
            /  size="xl" /> */}
              <Text>{imageUrl}</Text>
            </>
          )
        }
      </Box>
    </NativeBaseProvider>
  );
}