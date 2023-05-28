/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import http from "http";
import https from "https";
declare const comfyWeb: {
    APIs: {
        [key: string]: (qs: any, body: Buffer | null, context: {
            req: http.IncomingMessage;
            res: http.ServerResponse;
            params: string[];
        }) => Promise<any> | any;
    };
    Files: {
        [key: string]: (qs: any, body: Buffer | null, context: {
            req: http.IncomingMessage;
            res: http.ServerResponse;
        }) => Promise<any> | any;
    };
    Settings: {
        Directory?: string;
    };
    Run: (port: number, { useCORS, Certificate, PrivateKey, CertificateChain, Directory }: {
        useCORS?: boolean;
        Certificate?: string;
        PrivateKey?: string;
        CertificateChain?: string;
        Directory?: string;
    }) => Promise<http.Server | https.Server>;
    default: any;
};
export = comfyWeb;
