import jwt, { type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";

export const createToken = (
    payload: JwtPayload,
    secret: Secret,
    expiresIn: SignOptions["expiresIn"]
): string => {
    return jwt.sign(payload, secret, { expiresIn } as SignOptions);
};

export const verifyToken = (token: string, secret: Secret): JwtPayload => {
    return jwt.verify(token, secret) as JwtPayload;
};
