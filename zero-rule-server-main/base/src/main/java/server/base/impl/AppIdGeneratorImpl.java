package server.base.impl;

import org.apache.commons.lang3.RandomUtils;
import org.springframework.util.Assert;
import org.springframework.util.DigestUtils;
import server.base.AppIdGenerator;

public class AppIdGeneratorImpl implements AppIdGenerator {
    @Override
    public String gen64(String prefix, long seq) {
        return generate(prefix, "_" + seq, 32);
    }

    @Override
    public String gen32(String prefix, long seq) {
        return generate(prefix, "_" + seq, 64);
    }

    private String generate(String prefix, String suffix, int maxLength) {
        int randomStrLen = maxLength - prefix.length() - suffix.length();
        Assert.isTrue(randomStrLen > 0, "AppId generate fail. maxLength too small:" + maxLength);
        String randomKey = DigestUtils.md5DigestAsHex(RandomUtils.nextBytes(maxLength));
        if (randomKey.length() > randomStrLen) {
            randomKey = randomKey.substring(0, randomStrLen);
        }
        return prefix + randomKey.toLowerCase() + suffix;
    }
}
