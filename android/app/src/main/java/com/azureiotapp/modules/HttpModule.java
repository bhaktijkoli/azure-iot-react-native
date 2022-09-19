package com.azureiotapp.modules;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.security.cert.X509Certificate;
import java.util.Iterator;
import java.util.Map;
import java.util.HashMap;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.SSLSession;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.tls.Certificates;
import okhttp3.tls.HandshakeCertificates;

public class HttpModule extends ReactContextBaseJavaModule {

    private final String TAG = "HttpModule";
    private OkHttpClient client;

    HttpModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "HttpModule";
    }

    @ReactMethod
    public void createClient() {
        this.client = new OkHttpClient.Builder()
                .build();
    }

    @ReactMethod
    public void createSSLClient(String caStr, String hostnameStr) {
        final X509Certificate CustomCertificationAuthority = Certificates.decodeCertificatePem(caStr);
        HandshakeCertificates certificates = new HandshakeCertificates.Builder()
                .addTrustedCertificate(CustomCertificationAuthority)
                .addPlatformTrustedCertificates()
                .build();

        HostnameVerifier hostnameVerifier = new HostnameVerifier() {
            @Override
            public boolean verify(String hostname, SSLSession session) {
                return hostname.equals(hostnameStr);
            }
        };

        this.client = new OkHttpClient.Builder()
                .sslSocketFactory(certificates.sslSocketFactory(), certificates.trustManager())
                .hostnameVerifier(hostnameVerifier)
                .build();
    }

    @ReactMethod
    public void get(String url, Promise promise) {
        try {
            Request request = new Request.Builder()
                    .url(url)
                    .build();
            Response response = this.client.newCall(request).execute();
            promise.resolve(response.body().string());
        } catch (Exception e) {
            promise.reject(e.getMessage());
        }
    }

    @ReactMethod
    public void upload(String url, ReadableMap options, Promise promise) {
        try {
            ReadableArray files = options.getArray("files");
            MultipartBody.Builder bodyBuilder = new MultipartBody.Builder();
            bodyBuilder.setType(MultipartBody.FORM);
            for (int i = 0; i < files.size(); i++) {
                ReadableMap file = files.getMap(i);
                String name = file.getString("name");
                String fileName = file.getString("fileName");
                String type = file.getString("type");
                String uri = file.getString("uri").replace("file:/", "");
                bodyBuilder.addFormDataPart(name, fileName, RequestBody.create(MediaType.parse(type),new File(uri)));
            }
            ReadableMap fields = options.getMap("fields");
            for (Iterator<Map.Entry<String, Object>> it = fields.getEntryIterator(); it.hasNext(); ) {
                Map.Entry<String, Object> entry = it.next();
                bodyBuilder.addFormDataPart(entry.getKey(), entry.getValue().toString());
            }
            Request request = new Request.Builder()
                    .url(url)
                    .post(bodyBuilder.build())
                    .build();

            Response response = this.client.newCall(request).execute();
            promise.resolve(response.body().string());
        } catch (Exception e) {
            promise.reject(e.getMessage());
        }
    }

    @ReactMethod
    public void getImage(String url, Promise promise) {
        try {
            Request request = new Request.Builder()
                    .url(url)
                    .build();

            Response response = this.client.newCall(request).execute();
            InputStream inputStream = response.body().byteStream();
            Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
            ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
            byte[] byteArray = byteArrayOutputStream .toByteArray();
            String encoded = Base64.encodeToString(byteArray, Base64.DEFAULT);
            promise.resolve(encoded);
        } catch (Exception e) {
            promise.reject(e.getMessage());
        }
    }
}