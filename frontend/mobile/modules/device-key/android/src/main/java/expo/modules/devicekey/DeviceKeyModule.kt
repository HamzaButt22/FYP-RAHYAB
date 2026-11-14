package expo.modules.devicekey

import android.app.ActivityManager
import android.content.Context
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyInfo
import android.security.keystore.KeyProperties
import android.security.keystore.StrongBoxUnavailableException
import android.util.Base64
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.Signature
import java.security.spec.ECGenParameterSpec

/**
 * The phone's device key (ADR-0011, backend/api/src/rahyaab_api/device_keys.py).
 *
 * An EC P-256 key pair made inside the Android Keystore: StrongBox when the phone has it, otherwise the
 * phone's trusted execution environment. The private key never leaves the Keystore. JavaScript can only
 * read the public key and ask for a refresh signature; it cannot sign anything else, because the module
 * adds the "rahyaab-refresh-v1:" context itself.
 */
class DeviceKeyModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("RahyaabDeviceKey")

    // { publicKey: base64 DER SubjectPublicKeyInfo, hardware: "strongbox" | "tee" | "software" }
    AsyncFunction("getOrCreateKey") {
      synchronized(LOCK) {
        val store = keyStore()
        if (!store.containsAlias(ALIAS)) generate()
        val publicKey = store.getCertificate(ALIAS).publicKey.encoded
        mapOf("publicKey" to Base64.encodeToString(publicKey, Base64.NO_WRAP), "hardware" to hardware(privateKey(store)))
      }
    }

    // base64 DER SHA256withECDSA over "rahyaab-refresh-v1:" + refreshToken
    AsyncFunction("signRefresh") { refreshToken: String ->
      if (refreshToken.length !in 20..100 || refreshToken.any { it.code !in 0x21..0x7E }) {
        throw DeviceKeyException("not a refresh token")
      }
      val store = keyStore()
      if (!store.containsAlias(ALIAS)) throw DeviceKeyException("no device key")
      val signer = Signature.getInstance("SHA256withECDSA")
      signer.initSign(privateKey(store))
      signer.update((CONTEXT + refreshToken).toByteArray(Charsets.US_ASCII))
      Base64.encodeToString(signer.sign(), Base64.NO_WRAP)
    }

    AsyncFunction("deleteKey") {
      synchronized(LOCK) {
        val store = keyStore()
        if (store.containsAlias(ALIAS)) store.deleteEntry(ALIAS)
      }
    }

    // Coarse facts the join request needs (openapi.yaml DeviceInfo); no model name or identifier.
    Function("deviceInfo") {
      val memory = ActivityManager.MemoryInfo()
      (context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(memory)
      val gb = memory.totalMem / (1024.0 * 1024.0 * 1024.0)
      // Phones report less than their nominal RAM (a 4 GB phone shows about 3.6 GB).
      val ramClass = when {
        gb < 3.5 -> "low"
        gb < 7.0 -> "mid"
        else -> "high"
      }
      val osMajor = Build.VERSION.RELEASE.takeWhile { it.isDigit() }.toIntOrNull() ?: 0
      mapOf("ramClass" to ramClass, "osMajor" to osMajor)
    }
  }

  private fun keyStore(): KeyStore = KeyStore.getInstance(PROVIDER).apply { load(null) }

  private fun privateKey(store: KeyStore): PrivateKey =
    store.getKey(ALIAS, null) as? PrivateKey ?: throw DeviceKeyException("device key unreadable")

  private fun generate() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      try {
        generate(strongBox = true)
        return
      } catch (_: StrongBoxUnavailableException) {
        // No StrongBox chip on this phone: use the trusted execution environment instead.
      }
    }
    generate(strongBox = false)
  }

  private fun generate(strongBox: Boolean) {
    val spec = KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_SIGN)
      .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
      .setDigests(KeyProperties.DIGEST_SHA256)
    // No user authentication: refreshes run in the background, and the token is useless without this phone.
    if (strongBox && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) spec.setIsStrongBoxBacked(true)
    KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, PROVIDER).run {
      initialize(spec.build())
      generateKeyPair()
    }
  }

  private fun hardware(key: PrivateKey): String {
    val info = KeyFactory.getInstance(key.algorithm, PROVIDER).getKeySpec(key, KeyInfo::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      return when (info.securityLevel) {
        KeyProperties.SECURITY_LEVEL_STRONGBOX -> "strongbox"
        KeyProperties.SECURITY_LEVEL_TRUSTED_ENVIRONMENT -> "tee"
        else -> "software"
      }
    }
    @Suppress("DEPRECATION")
    return if (info.isInsideSecureHardware) "tee" else "software"
  }

  private class DeviceKeyException(message: String) : CodedException("ERR_DEVICE_KEY", message, null)

  companion object {
    private const val PROVIDER = "AndroidKeyStore"
    private const val ALIAS = "rahyaab.device.v1"
    private const val CONTEXT = "rahyaab-refresh-v1:"
    private val LOCK = Any()
  }
}
