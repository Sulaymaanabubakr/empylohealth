const { withAppDelegate, createRunOncePlugin } = require('expo/config-plugins');

const addImports = (src) => {
  let out = src;
  if (!out.includes('#import <PushKit/PushKit.h>')) {
    out = out.replace('#import "AppDelegate.h"', '#import "AppDelegate.h"\n#import <PushKit/PushKit.h>');
  }
  if (!out.includes('#import "RNVoipPushNotificationManager.h"')) {
    out = out.replace('#import <PushKit/PushKit.h>', '#import <PushKit/PushKit.h>\n#import "RNVoipPushNotificationManager.h"');
  }
  return out;
};

const addDelegateProtocol = (src) => {
  if (src.includes('PKPushRegistryDelegate')) return src;
  return src.replace(/@interface\s+AppDelegate\s*:\s*([^{\n]+)/, '@interface AppDelegate : $1 <PKPushRegistryDelegate>');
};

const addVoipSetupInDidFinishLaunching = (src) => {
  if (src.includes('[RNVoipPushNotificationManager voipRegistration]')) return src;

  const marker = src.includes('self.moduleName = @"main";')
    ? 'self.moduleName = @"main";'
    : (src.includes('self.initialProps = @{};') ? 'self.initialProps = @{};' : null);
  if (!marker) return src;

  const injection = [
    marker,
    '',
    '  // Register for PushKit VoIP pushes.',
    '  [RNVoipPushNotificationManager voipRegistration];',
    '  PKPushRegistry *voipRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];',
    '  voipRegistry.delegate = self;',
    '  voipRegistry.desiredPushTypes = [NSSet setWithObject:PKPushTypeVoIP];'
  ].join('\n');

  return src.replace(marker, injection);
};

const addPushRegistryMethods = (src) => {
  if (src.includes('didReceiveIncomingPushWithPayload')) return src;

  const methods = `

- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type
{
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type
{
  // No-op: token invalidation is handled server-side on send failures.
}

- (void)pushRegistry:(PKPushRegistry *)registry
didReceiveIncomingPushWithPayload:(PKPushPayload *)payload
             forType:(PKPushType)type
withCompletionHandler:(void (^)(void))completion
{
  [RNVoipPushNotificationManager addCompletionHandler:payload.dictionaryPayload[@"uuid"] completionHandler:completion];
  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];
}
`;

  return src.replace(/@end\s*$/, `${methods}\n@end`);
};

const withVoipCallkit = (config) =>
  withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'objc' && mod.modResults.language !== 'objcpp') {
      return mod;
    }

    let contents = mod.modResults.contents;
    contents = addImports(contents);
    contents = addDelegateProtocol(contents);
    contents = addVoipSetupInDidFinishLaunching(contents);
    contents = addPushRegistryMethods(contents);
    mod.modResults.contents = contents;
    return mod;
  });

module.exports = createRunOncePlugin(withVoipCallkit, 'with-voip-callkit', '1.0.0');
